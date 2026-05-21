// ─── Trigger Keys ─────────────────────────────────────────────────────────────
export type TriggerKey =
  | 'task.status.changed'
  | 'task.created'
  | 'task.assigned'
  | 'task.priority.changed'
  | 'task.due_date.passed'
  | 'issue.created'
  | 'issue.status.changed'
  | 'project.created'
  | 'sprint.started'
  | 'sprint.completed';

// ─── Condition Keys ────────────────────────────────────────────────────────────
export type ConditionKey =
  | 'field.equals'
  | 'field.not_equals'
  | 'field.contains'
  | 'field.not_contains'
  | 'field.greater_than'
  | 'field.less_than'
  | 'field.is_empty'
  | 'field.is_not_empty'
  | 'user.has_role';

// ─── Action Keys ──────────────────────────────────────────────────────────────
export type ActionKey =
  | 'notification.create'
  | 'webhook.send'
  | 'task.update'
  | 'task.create'
  | 'task.assign'
  | 'email.send'
  | 'comment.create';

// ─── Trigger Payload ──────────────────────────────────────────────────────────
/**
 * Normalized event payload emitted by any domain service.
 * All fields are optional except event + entityId + tenantId.
 */
export interface TriggerPayload {
  /** Discriminator — must match a registered TriggerKey */
  event: TriggerKey;
  entityId: string;
  entityType: string;
  tenantId: string;
  projectId?: string;
  userId?: string;
  /** Entity state before the change */
  before?: Record<string, unknown>;
  /** Entity state after the change */
  after?: Record<string, unknown>;
  /** Extra event-specific metadata */
  metadata?: Record<string, unknown>;
}

// ─── Condition Tree ───────────────────────────────────────────────────────────
export type LogicalOperator = 'AND' | 'OR' | 'NOT';

/** Terminal condition node — evaluated by a registered ICondition handler */
export interface ConditionLeaf {
  type: 'leaf';
  key: ConditionKey;
  params: Record<string, unknown>;
}

/** Composite node — recursively combines children with AND / OR / NOT */
export interface ConditionGroup {
  type: 'group';
  operator: LogicalOperator;
  children: ConditionNode[];
}

export type ConditionNode = ConditionLeaf | ConditionGroup;

// ─── Action Step Tree ─────────────────────────────────────────────────────────
/** Terminal action node — executed by a registered IAction handler */
export interface ActionLeaf {
  type: 'action';
  key: ActionKey;
  params: Record<string, unknown>;
  /** When true the runner continues to the next step even if this one fails */
  continueOnFailure?: boolean;
}

/** Branching node — evaluates a condition and routes to then/else steps */
export interface BranchNode {
  type: 'branch';
  condition: ConditionNode;
  then: ActionStep[];
  else?: ActionStep[];
}

export type ActionStep = ActionLeaf | BranchNode;

// ─── Automation Rule Config ───────────────────────────────────────────────────
/** The full configuration of one AutomationRule, stored as JSON in the DB */
export interface AutomationRuleConfig {
  trigger: {
    key: TriggerKey;
    /** Optional trigger-scoped filter params (e.g. specific status values) */
    params?: Record<string, unknown>;
  };
  /** Global pre-filter: evaluated before any steps run */
  conditions?: ConditionNode;
  /** Ordered list of steps (actions + branches) */
  steps: ActionStep[];
}

// ─── Execution Context ────────────────────────────────────────────────────────
/** Tracks the chain depth and ruleIds already executed to detect loops */
export interface ChainContext {
  depth: number;
  fingerprint: string[];
}

/**
 * Immutable (except variables) context object threaded through every step.
 * Background workers create this; the runner reads it.
 */
export interface ExecutionContext {
  ruleId: string;
  executionId: string;
  tenantId: string;
  projectId?: string;
  userId?: string;
  isDryRun: boolean;
  chain: ChainContext;
  payload: TriggerPayload;
  /** Mutable bag: steps can write outputs here for downstream template interpolation */
  variables: Record<string, unknown>;
}

// ─── Step Result ──────────────────────────────────────────────────────────────
export type StepStatus = 'success' | 'failed' | 'skipped' | 'dry_run';

export interface StepResult {
  status: StepStatus;
  output?: unknown;
  error?: Error;
  durationMs: number;
}

// ─── Handler Interfaces ───────────────────────────────────────────────────────

/**
 * A Trigger is a pure value object.
 * It only needs to decide whether its key matches the incoming payload.
 */
export interface ITrigger {
  readonly key: TriggerKey;
  readonly displayName: string;
  readonly description: string;
  matches(payload: TriggerPayload, params: Record<string, unknown>): boolean;
}

/**
 * A Condition evaluates a boolean predicate against the execution context.
 * May be async (e.g. DB lookups).
 */
export interface ICondition {
  readonly key: ConditionKey;
  readonly displayName: string;
  evaluate(
    params: Record<string, unknown>,
    context: ExecutionContext,
  ): boolean | Promise<boolean>;
}

/**
 * An Action performs a side effect.
 * `executeDryRun` must produce the same output shape but skip all side effects.
 */
export interface IAction {
  readonly key: ActionKey;
  readonly displayName: string;
  execute(params: Record<string, unknown>, context: ExecutionContext): Promise<unknown>;
  executeDryRun(params: Record<string, unknown>, context: ExecutionContext): Promise<unknown>;
}

// ─── Queue Job Data ───────────────────────────────────────────────────────────
export interface AutomationJobData {
  ruleId: string;
  executionId: string;
  triggerPayload: TriggerPayload;
  isDryRun: boolean;
  chain: ChainContext;
}

// ─── CRUD DTOs ────────────────────────────────────────────────────────────────
export interface CreateAutomationRuleDto {
  name: string;
  description?: string;
  projectId?: string;
  isActive?: boolean;
  triggerKey: TriggerKey;
  triggerParams?: Record<string, unknown>;
  conditions?: ConditionNode;
  steps: ActionStep[];
}

export interface UpdateAutomationRuleDto {
  name?: string;
  description?: string;
  isActive?: boolean;
  triggerKey?: TriggerKey;
  triggerParams?: Record<string, unknown>;
  conditions?: ConditionNode;
  steps?: ActionStep[];
}
