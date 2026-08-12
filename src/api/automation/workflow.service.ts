import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

export interface WorkflowTrigger {
  type: 'task_created' | 'task_updated' | 'task_completed' | 'task_assigned' | 'project_created' | 'due_date_approaching' | 'custom';
  conditions?: Record<string, any>;
}

export interface WorkflowAction {
  type: 'create_task' | 'update_task' | 'send_notification' | 'assign_user' | 'change_status' | 'send_email' | 'webhook' | 'run_agent' | 'custom';
  parameters: Record<string, any>;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: WorkflowTrigger;
  conditions: Array<{
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
    value: any;
  }>;
  actions: WorkflowAction[];
  projectId?: string;
  tenantId: string;
}

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly aiService: AiService,
  ) {
    // Listen to events
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.eventEmitter.on('task.created', (data) => this.handleEvent('task_created', data));
    this.eventEmitter.on('task.updated', (data) => this.handleEvent('task_updated', data));
    this.eventEmitter.on('task.completed', (data) => this.handleEvent('task_completed', data));
    this.eventEmitter.on('task.assigned', (data) => this.handleEvent('task_assigned', data));
    this.eventEmitter.on('project.created', (data) => this.handleEvent('project_created', data));
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(tenantId: string, workflow: Omit<Workflow, 'id' | 'tenantId'>): Promise<Workflow> {
    const created = await this.prisma.tx.workflow.create({
      data: {
        tenantId,
        name: workflow.name,
        description: workflow.description,
        enabled: workflow.enabled,
        trigger: workflow.trigger as any,
        conditions: workflow.conditions as any,
        actions: workflow.actions as any,
        projectId: workflow.projectId,
      },
    });

    return this.mapToWorkflow(created);
  }

  /**
   * Get all workflows for a tenant
   */
  async getWorkflows(tenantId: string, projectId?: string): Promise<Workflow[]> {
    const where: any = { tenantId };
    if (projectId) {
      where.projectId = projectId;
    }

    const workflows = await this.prisma.tx.workflow.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return workflows.map((w) => this.mapToWorkflow(w));
  }

  /**
   * Update workflow
   */
  async updateWorkflow(tenantId: string, workflowId: string, updates: Partial<Workflow>): Promise<Workflow> {
    const updated = await this.prisma.tx.workflow.update({
      where: { id: workflowId, tenantId },
      data: {
        name: updates.name,
        description: updates.description,
        enabled: updates.enabled,
        trigger: updates.trigger as any,
        conditions: updates.conditions as any,
        actions: updates.actions as any,
      },
    });

    return this.mapToWorkflow(updated);
  }

  /**
   * Delete workflow
   */
  async deleteWorkflow(tenantId: string, workflowId: string): Promise<void> {
    await this.prisma.tx.workflow.delete({
      where: { id: workflowId, tenantId },
    });
  }

  /**
   * Handle event and trigger workflows
   */
  private async handleEvent(eventType: string, data: any) {
    const { tenantId, projectId } = data;

    // Get all enabled workflows for this trigger
    const workflows = await this.prisma.tx.workflow.findMany({
      where: {
        tenantId,
        enabled: true,
        trigger: {
          path: ['type'],
          equals: eventType,
        },
      },
    });

    for (const workflow of workflows) {
      try {
        // Check if workflow matches project
        if (workflow.projectId && workflow.projectId !== projectId) {
          continue;
        }

        const mappedWorkflow = this.mapToWorkflow(workflow);

        // Evaluate conditions
        if (this.evaluateConditions(mappedWorkflow.conditions, data)) {
          // Execute actions
          await this.executeActions(tenantId, mappedWorkflow.actions, data);
          
          // Log workflow execution
          await this.logWorkflowExecution(tenantId, workflow.id, data, 'success');
        }
      } catch (error) {
        this.logger.error(`Error executing workflow ${workflow.id}:`, error);
        await this.logWorkflowExecution(tenantId, workflow.id, data, 'error', error instanceof Error ? error.message : String(error));
      }
    }
  }

  /**
   * Evaluate workflow conditions
   */
  private evaluateConditions(conditions: Workflow['conditions'], data: any): boolean {
    if (!conditions || conditions.length === 0) {
      return true;
    }

    return conditions.every((condition) => {
      const fieldValue = this.getNestedValue(data, condition.field);
      
      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'not_equals':
          return fieldValue !== condition.value;
        case 'contains':
          return String(fieldValue).includes(String(condition.value));
        case 'greater_than':
          return Number(fieldValue) > Number(condition.value);
        case 'less_than':
          return Number(fieldValue) < Number(condition.value);
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(fieldValue);
        case 'not_in':
          return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
        default:
          return false;
      }
    });
  }

  /**
   * Execute workflow actions
   */
  private async executeActions(tenantId: string, actions: WorkflowAction[], contextData: any) {
    for (const action of actions) {
      try {
        await this.executeAction(tenantId, action, contextData);
      } catch (error) {
        this.logger.error(`Error executing action ${action.type}:`, error);
        throw error;
      }
    }
  }

  /**
   * Execute single action
   */
  private async executeAction(tenantId: string, action: WorkflowAction, contextData: any) {
    switch (action.type) {
      case 'create_task':
        await this.createTaskAction(tenantId, action.parameters, contextData);
        break;
      case 'update_task':
        await this.updateTaskAction(tenantId, action.parameters, contextData);
        break;
      case 'send_notification':
        await this.sendNotificationAction(tenantId, action.parameters, contextData);
        break;
      case 'assign_user':
        await this.assignUserAction(tenantId, action.parameters, contextData);
        break;
      case 'change_status':
        await this.changeStatusAction(tenantId, action.parameters, contextData);
        break;
      case 'send_email':
        await this.sendEmailAction(action.parameters, contextData);
        break;
      case 'webhook':
        await this.webhookAction(action.parameters, contextData);
        break;
      case 'run_agent':
        await this.runAgentAction(tenantId, action.parameters, contextData);
        break;
      default:
        this.logger.warn(`Unknown action type: ${action.type}`);
    }
  }

  // Action implementations
  private async createTaskAction(tenantId: string, params: any, context: any) {
    const taskData = {
      tenantId,
      projectId: this.interpolate(params.projectId, context),
      title: this.interpolate(params.title, context),
      description: this.interpolate(params.description, context),
      status: params.status || 'todo',
      priority: params.priority || 'medium',
    };

    await this.prisma.tx.task.create({ data: taskData });
  }

  private async updateTaskAction(tenantId: string, params: any, context: any) {
    const taskId = this.interpolate(params.taskId, context) || context.taskId;
    
    await this.prisma.tx.task.update({
      where: { id: taskId, tenantId },
      data: {
        ...(params.title && { title: this.interpolate(params.title, context) }),
        ...(params.description && { description: this.interpolate(params.description, context) }),
        ...(params.status && { status: params.status }),
        ...(params.priority && { priority: params.priority }),
      },
    });
  }

  private async sendNotificationAction(tenantId: string, params: any, context: any) {
    const userId = this.interpolate(params.userId, context);
    const message = this.interpolate(params.message, context);

    await this.prisma.tx.notification.create({
      data: {
        tenantId,
        userId,
        type: params.type || 'info',
        title: this.interpolate(params.title, context),
        message,
        read: false,
      },
    });
  }

  private async assignUserAction(tenantId: string, params: any, context: any) {
    const taskId = this.interpolate(params.taskId, context) || context.taskId;
    const userId = this.interpolate(params.userId, context);

    await this.prisma.tx.taskAssignee.create({
      data: {
        tenantId,
        taskId,
        userId,
      },
    });
  }

  private async changeStatusAction(tenantId: string, params: any, context: any) {
    const taskId = this.interpolate(params.taskId, context) || context.taskId;
    const status = params.status;

    await this.prisma.tx.task.update({
      where: { id: taskId, tenantId },
      data: { status },
    });
  }

  private async sendEmailAction(params: any, context: any) {
    // Email sending would be implemented with a service like SendGrid, AWS SES, etc.
    this.logger.log(`Email action: ${JSON.stringify(params)}`);
    // TODO: Implement actual email sending
  }

  private async webhookAction(params: any, context: any) {
    const url = this.interpolate(params.url, context);
    const method = params.method || 'POST';
    const body = params.body ? JSON.parse(this.interpolate(JSON.stringify(params.body), context)) : context;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(params.headers || {}),
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed with status ${response.status}`);
      }
    } catch (error) {
      this.logger.error(`Webhook error:`, error);
      throw error;
    }
  }

  private async runAgentAction(tenantId: string, params: any, context: any) {
    const agentId = params.agentId;
    const inputTemplate = params.input || {};
    
    // Interpolate input values from context
    const input: any = {};
    for (const [key, value] of Object.entries(inputTemplate)) {
      if (typeof value === 'string') {
        input[key] = this.interpolate(value, context);
      } else {
        input[key] = value;
      }
    }

    try {
      const result = await this.aiService.runAgent(tenantId, agentId, input);
      
      this.logger.log(`Agent ${agentId} executed successfully in workflow`);
      
      // Optionally create a task or notification with the agent output
      if (params.createTaskFromOutput && result.output) {
        const taskData = {
          tenantId,
          projectId: this.interpolate(params.projectId, context) || context.projectId,
          title: params.taskTitle || 'AI-Generated Task',
          description: JSON.stringify(result.output, null, 2),
          status: 'todo',
          priority: params.taskPriority || 'medium',
        };

        await this.prisma.tx.task.create({ data: taskData });
      }

      return result;
    } catch (error) {
      this.logger.error(`Agent action error:`, error);
      throw error;
    }
  }

  /**
   * Interpolate template strings with context data
   */
  private interpolate(template: string, context: any): string {
    if (typeof template !== 'string') {
      return template;
    }

    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
      const value = this.getNestedValue(context, path);
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Get nested value from object by path
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Log workflow execution
   */
  private async logWorkflowExecution(
    tenantId: string,
    workflowId: string,
    data: any,
    status: 'success' | 'error',
    errorMessage?: string,
  ) {
    await this.prisma.tx.workflowExecution.create({
      data: {
        tenantId,
        workflowId,
        status,
        data: data as any,
        error: errorMessage,
      },
    });
  }

  /**
   * Map database workflow to Workflow type
   */
  private mapToWorkflow(dbWorkflow: any): Workflow {
    return {
      id: dbWorkflow.id,
      name: dbWorkflow.name,
      description: dbWorkflow.description,
      enabled: dbWorkflow.enabled,
      trigger: dbWorkflow.trigger as WorkflowTrigger,
      conditions: dbWorkflow.conditions as Workflow['conditions'],
      actions: dbWorkflow.actions as WorkflowAction[],
      projectId: dbWorkflow.projectId || undefined,
      tenantId: dbWorkflow.tenantId,
    };
  }

  /**
   * Test workflow with sample data
   */
  async testWorkflow(tenantId: string, workflowId: string, sampleData: any): Promise<{
    conditionsMet: boolean;
    actionsExecuted: string[];
    errors: string[];
  }> {
    const workflow = await this.prisma.tx.workflow.findFirst({
      where: { id: workflowId, tenantId },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    const mappedWorkflow = this.mapToWorkflow(workflow);
    const conditionsMet = this.evaluateConditions(mappedWorkflow.conditions, sampleData);
    const actionsExecuted: string[] = [];
    const errors: string[] = [];

    if (conditionsMet) {
      for (const action of mappedWorkflow.actions) {
        try {
          // Don't actually execute, just validate
          actionsExecuted.push(action.type);
        } catch (error) {
          errors.push(`${action.type}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    return {
      conditionsMet,
      actionsExecuted,
      errors,
    };
  }
}

