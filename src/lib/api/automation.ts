/**
 * Automation API Client — wired to the v2 /automation/rules endpoints
 */
import { apiClient } from '../api-client';

// ─── Types matching the backend ────────────────────────────────────────────────

export type TriggerKey =
  | 'task.status.changed'
  | 'task.created'
  | 'task.assigned'
  | 'task.priority.changed'
  | 'issue.created'
  | 'issue.status.changed'
  | 'project.created';

export type ActionKey =
  | 'notification.create'
  | 'webhook.send'
  | 'task.update'
  | 'task.create'
  | 'task.assign'
  | 'email.send'
  | 'comment.create';

export type ConditionKey =
  | 'field.equals'
  | 'field.not_equals'
  | 'field.contains'
  | 'field.greater_than'
  | 'field.less_than'
  | 'field.is_empty'
  | 'field.is_not_empty'
  | 'user.has_role';

export interface ConditionLeaf {
  type: 'leaf';
  key: ConditionKey;
  params: Record<string, unknown>;
}
export interface ConditionGroup {
  type: 'group';
  operator: 'AND' | 'OR' | 'NOT';
  children: ConditionNode[];
}
export type ConditionNode = ConditionLeaf | ConditionGroup;

export interface ActionLeaf {
  type: 'action';
  key: ActionKey;
  params: Record<string, unknown>;
  continueOnFailure?: boolean;
}
export interface BranchNode {
  type: 'branch';
  condition: ConditionNode;
  then: ActionStep[];
  else?: ActionStep[];
}
export type ActionStep = ActionLeaf | BranchNode;

export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  triggerKey: TriggerKey;
  triggerParams?: Record<string, unknown>;
  conditions?: ConditionNode;
  steps?: ActionStep[];
  projectId?: string;
  version: number;
  createdAt: string;
  updatedAt?: string;
  _count?: { executions: number };
}

export interface CreateRuleDto {
  name: string;
  description?: string;
  projectId?: string;
  isActive?: boolean;
  triggerKey: TriggerKey;
  triggerParams?: Record<string, unknown>;
  conditions?: ConditionNode;
  steps: ActionStep[];
}

export interface UpdateRuleDto {
  name?: string;
  description?: string;
  isActive?: boolean;
  triggerKey?: TriggerKey;
  triggerParams?: Record<string, unknown>;
  conditions?: ConditionNode;
  steps?: ActionStep[];
}

export type ExecutionStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'DRY_RUN';

export interface AutomationExecution {
  id: string;
  ruleId: string;
  status: ExecutionStatus;
  isDryRun: boolean;
  chainDepth: number;
  durationMs?: number;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  rule?: { name: string; triggerKey: string };
}

export interface AutomationStepLog {
  id: string;
  stepIndex: number;
  stepType: 'CONDITION' | 'ACTION' | 'BRANCH';
  stepKey: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'DRY_RUN';
  inputPayload: unknown;
  outputPayload?: unknown;
  errorMessage?: string;
  errorStack?: string;
  durationMs?: number;
}

export interface AutomationExecutionDetail extends AutomationExecution {
  stepLogs: AutomationStepLog[];
  triggerPayload: unknown;
}

// ─── Trigger display metadata ─────────────────────────────────────────────────

export const TRIGGER_META: Record<TriggerKey, { label: string; description: string; color: string }> = {
  'task.status.changed':   { label: 'Task Status Changed',   description: 'When a task moves to a new status', color: 'bg-blue-100 text-blue-700' },
  'task.created':          { label: 'Task Created',           description: 'When a new task is created',        color: 'bg-emerald-100 text-emerald-700' },
  'task.assigned':         { label: 'Task Assigned',          description: 'When a task is assigned to someone', color: 'bg-violet-100 text-violet-700' },
  'task.priority.changed': { label: 'Priority Changed',       description: 'When a task priority changes',      color: 'bg-amber-100 text-amber-700' },
  'issue.created':         { label: 'Issue Created',          description: 'When a new issue is filed',         color: 'bg-red-100 text-red-700' },
  'issue.status.changed':  { label: 'Issue Status Changed',  description: 'When an issue status changes',      color: 'bg-orange-100 text-orange-700' },
  'project.created':       { label: 'Project Created',        description: 'When a new project is created',     color: 'bg-teal-100 text-teal-700' },
};

export const ACTION_META: Record<ActionKey, { label: string; description: string; icon: string }> = {
  'notification.create': { label: 'Send Notification', description: 'Create an in-app notification',    icon: '🔔' },
  'webhook.send':        { label: 'Send Webhook',       description: 'POST data to an external URL',    icon: '🌐' },
  'task.update':         { label: 'Update Task',        description: 'Modify task fields',              icon: '✏️' },
  'task.create':         { label: 'Create Task',        description: 'Create a new task',               icon: '➕' },
  'task.assign':         { label: 'Assign Task',        description: 'Assign a task to a user',         icon: '👤' },
  'email.send':          { label: 'Send Email',         description: 'Send an email to a recipient',    icon: '📧' },
  'comment.create':      { label: 'Add Comment',        description: 'Post a comment on the entity',    icon: '💬' },
};

// ─── API functions ────────────────────────────────────────────────────────────

export const automationApi = {
  /** List all rules for current tenant */
  async getRules(projectId?: string): Promise<AutomationRule[]> {
    return apiClient.get('/automation/rules', { params: projectId ? { projectId } : {} });
  },

  /** Get a single rule */
  async getRule(id: string): Promise<AutomationRule> {
    return apiClient.get(`/automation/rules/${id}`);
  },

  /** Create a new rule */
  async createRule(data: CreateRuleDto): Promise<AutomationRule> {
    return apiClient.post('/automation/rules', data);
  },

  /** Update a rule */
  async updateRule(id: string, data: UpdateRuleDto): Promise<AutomationRule> {
    return apiClient.put(`/automation/rules/${id}`, data);
  },

  /** Delete a rule */
  async deleteRule(id: string): Promise<void> {
    return apiClient.delete(`/automation/rules/${id}`);
  },

  /** Toggle active/inactive */
  async toggleRule(id: string, isActive: boolean): Promise<AutomationRule> {
    return apiClient.patch(`/automation/rules/${id}/toggle`, { isActive });
  },

  /** Dry-run a rule with sample payload */
  async dryRun(id: string, samplePayload?: Record<string, unknown>): Promise<{ dispatchedCount: number; executionIds: string[] }> {
    return apiClient.post(`/automation/rules/${id}/dry-run`, samplePayload ?? {});
  },

  /** Get execution history */
  async getExecutions(ruleId?: string, limit = 50, offset = 0): Promise<AutomationExecution[]> {
    return apiClient.get('/automation/executions', { params: { ruleId, limit, offset } });
  },

  /** Get a single execution with step logs */
  async getExecution(id: string): Promise<AutomationExecutionDetail> {
    return apiClient.get(`/automation/executions/${id}`);
  },

  /** Replay a past execution */
  async replay(executionId: string, dryRun = false): Promise<{ dispatchedCount: number; executionIds: string[] }> {
    return apiClient.post(`/automation/executions/${executionId}/replay`, undefined, {
      params: { dryRun: dryRun ? 'true' : 'false' },
    });
  },

  /** Get trigger/action catalog */
  async getCatalog(): Promise<Array<{ key: string; displayName: string; description: string }>> {
    return apiClient.get('/automation/catalog');
  },

  // ─── Legacy compatibility (used by WorkflowBuilder saving) ────────────────
  async getWorkflows(projectId?: string) { return automationApi.getRules(projectId); },
  async createWorkflow(data: any) { return automationApi.createRule(data); },
  async updateWorkflow(id: string, data: any) { return automationApi.updateRule(id, data); },
  async deleteWorkflow(id: string) { return automationApi.deleteRule(id); },
  async testWorkflow(id: string, sampleData: any) { return automationApi.dryRun(id, sampleData); },
};
