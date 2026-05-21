import { Injectable } from '@nestjs/common';
import { ITrigger, TriggerKey, TriggerPayload } from '../../types';

@Injectable()
export class TaskStatusChangedTrigger implements ITrigger {
  readonly key: TriggerKey = 'task.status.changed';
  readonly displayName = 'Task Status Changed';
  readonly description = 'Fires whenever a task moves to a different status column';

  matches(payload: TriggerPayload, params: Record<string, unknown>): boolean {
    if (payload.event !== this.key) return false;
    if (payload.before?.status === payload.after?.status) return false;
    // Optional: filter to specific target status
    if (params.toStatus && payload.after?.status !== params.toStatus) return false;
    if (params.fromStatus && payload.before?.status !== params.fromStatus) return false;
    return true;
  }
}

@Injectable()
export class TaskCreatedTrigger implements ITrigger {
  readonly key: TriggerKey = 'task.created';
  readonly displayName = 'Task Created';
  readonly description = 'Fires when a new task is created in a project';

  matches(payload: TriggerPayload, _params: Record<string, unknown>): boolean {
    return payload.event === this.key;
  }
}

@Injectable()
export class TaskAssignedTrigger implements ITrigger {
  readonly key: TriggerKey = 'task.assigned';
  readonly displayName = 'Task Assigned';
  readonly description = 'Fires when a task is assigned or re-assigned to a user';

  matches(payload: TriggerPayload, params: Record<string, unknown>): boolean {
    if (payload.event !== this.key) return false;
    // Optional: only fire when assigned to a specific user
    if (params.userId && payload.after?.assigneeId !== params.userId) return false;
    return true;
  }
}

@Injectable()
export class IssueStatusChangedTrigger implements ITrigger {
  readonly key: TriggerKey = 'issue.status.changed';
  readonly displayName = 'Issue Status Changed';
  readonly description = 'Fires when an issue transitions to a different status';

  matches(payload: TriggerPayload, params: Record<string, unknown>): boolean {
    if (payload.event !== this.key) return false;
    if (payload.before?.status === payload.after?.status) return false;
    if (params.toStatus && payload.after?.status !== params.toStatus) return false;
    return true;
  }
}

@Injectable()
export class ProjectCreatedTrigger implements ITrigger {
  readonly key: TriggerKey = 'project.created';
  readonly displayName = 'Project Created';
  readonly description = 'Fires when a new project is created in the tenant';

  matches(payload: TriggerPayload, _params: Record<string, unknown>): boolean {
    return payload.event === this.key;
  }
}
