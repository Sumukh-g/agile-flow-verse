"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WorkflowService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../prisma/prisma.service");
const ai_service_1 = require("../ai/ai.service");
let WorkflowService = WorkflowService_1 = class WorkflowService {
    constructor(prisma, eventEmitter, aiService) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
        this.aiService = aiService;
        this.logger = new common_1.Logger(WorkflowService_1.name);
        // Listen to events
        this.setupEventListeners();
    }
    setupEventListeners() {
        this.eventEmitter.on('task.created', (data) => this.handleEvent('task_created', data));
        this.eventEmitter.on('task.updated', (data) => this.handleEvent('task_updated', data));
        this.eventEmitter.on('task.completed', (data) => this.handleEvent('task_completed', data));
        this.eventEmitter.on('task.assigned', (data) => this.handleEvent('task_assigned', data));
        this.eventEmitter.on('project.created', (data) => this.handleEvent('project_created', data));
    }
    /**
     * Create a new workflow
     */
    async createWorkflow(tenantId, workflow) {
        const created = await this.prisma.tx.workflow.create({
            data: {
                tenantId,
                name: workflow.name,
                description: workflow.description,
                enabled: workflow.enabled,
                trigger: workflow.trigger,
                conditions: workflow.conditions,
                actions: workflow.actions,
                projectId: workflow.projectId,
            },
        });
        return this.mapToWorkflow(created);
    }
    /**
     * Get all workflows for a tenant
     */
    async getWorkflows(tenantId, projectId) {
        const where = { tenantId };
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
    async updateWorkflow(tenantId, workflowId, updates) {
        const updated = await this.prisma.tx.workflow.update({
            where: { id: workflowId, tenantId },
            data: {
                name: updates.name,
                description: updates.description,
                enabled: updates.enabled,
                trigger: updates.trigger,
                conditions: updates.conditions,
                actions: updates.actions,
            },
        });
        return this.mapToWorkflow(updated);
    }
    /**
     * Delete workflow
     */
    async deleteWorkflow(tenantId, workflowId) {
        await this.prisma.tx.workflow.delete({
            where: { id: workflowId, tenantId },
        });
    }
    /**
     * Handle event and trigger workflows
     */
    async handleEvent(eventType, data) {
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
            }
            catch (error) {
                this.logger.error(`Error executing workflow ${workflow.id}:`, error);
                await this.logWorkflowExecution(tenantId, workflow.id, data, 'error', error instanceof Error ? error.message : String(error));
            }
        }
    }
    /**
     * Evaluate workflow conditions
     */
    evaluateConditions(conditions, data) {
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
    async executeActions(tenantId, actions, contextData) {
        for (const action of actions) {
            try {
                await this.executeAction(tenantId, action, contextData);
            }
            catch (error) {
                this.logger.error(`Error executing action ${action.type}:`, error);
                throw error;
            }
        }
    }
    /**
     * Execute single action
     */
    async executeAction(tenantId, action, contextData) {
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
    async createTaskAction(tenantId, params, context) {
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
    async updateTaskAction(tenantId, params, context) {
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
    async sendNotificationAction(tenantId, params, context) {
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
    async assignUserAction(tenantId, params, context) {
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
    async changeStatusAction(tenantId, params, context) {
        const taskId = this.interpolate(params.taskId, context) || context.taskId;
        const status = params.status;
        await this.prisma.tx.task.update({
            where: { id: taskId, tenantId },
            data: { status },
        });
    }
    async sendEmailAction(params, context) {
        // Email sending would be implemented with a service like SendGrid, AWS SES, etc.
        this.logger.log(`Email action: ${JSON.stringify(params)}`);
        // TODO: Implement actual email sending
    }
    async webhookAction(params, context) {
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
        }
        catch (error) {
            this.logger.error(`Webhook error:`, error);
            throw error;
        }
    }
    async runAgentAction(tenantId, params, context) {
        const agentId = params.agentId;
        const inputTemplate = params.input || {};
        // Interpolate input values from context
        const input = {};
        for (const [key, value] of Object.entries(inputTemplate)) {
            if (typeof value === 'string') {
                input[key] = this.interpolate(value, context);
            }
            else {
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
        }
        catch (error) {
            this.logger.error(`Agent action error:`, error);
            throw error;
        }
    }
    /**
     * Interpolate template strings with context data
     */
    interpolate(template, context) {
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
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    /**
     * Log workflow execution
     */
    async logWorkflowExecution(tenantId, workflowId, data, status, errorMessage) {
        await this.prisma.tx.workflowExecution.create({
            data: {
                tenantId,
                workflowId,
                status,
                data: data,
                error: errorMessage,
            },
        });
    }
    /**
     * Map database workflow to Workflow type
     */
    mapToWorkflow(dbWorkflow) {
        return {
            id: dbWorkflow.id,
            name: dbWorkflow.name,
            description: dbWorkflow.description,
            enabled: dbWorkflow.enabled,
            trigger: dbWorkflow.trigger,
            conditions: dbWorkflow.conditions,
            actions: dbWorkflow.actions,
            projectId: dbWorkflow.projectId || undefined,
            tenantId: dbWorkflow.tenantId,
        };
    }
    /**
     * Test workflow with sample data
     */
    async testWorkflow(tenantId, workflowId, sampleData) {
        const workflow = await this.prisma.tx.workflow.findFirst({
            where: { id: workflowId, tenantId },
        });
        if (!workflow) {
            throw new Error('Workflow not found');
        }
        const mappedWorkflow = this.mapToWorkflow(workflow);
        const conditionsMet = this.evaluateConditions(mappedWorkflow.conditions, sampleData);
        const actionsExecuted = [];
        const errors = [];
        if (conditionsMet) {
            for (const action of mappedWorkflow.actions) {
                try {
                    // Don't actually execute, just validate
                    actionsExecuted.push(action.type);
                }
                catch (error) {
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
};
exports.WorkflowService = WorkflowService;
exports.WorkflowService = WorkflowService = WorkflowService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2,
        ai_service_1.AiService])
], WorkflowService);
