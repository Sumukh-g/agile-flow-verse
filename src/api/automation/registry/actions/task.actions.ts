import { Injectable, Logger } from '@nestjs/common';
import { IAction, ActionKey, ExecutionContext } from '../../types';
import { PrismaService } from '../../../prisma/prisma.service';

/** Replaces {{some.path}} tokens using the execution context's merged variables */
function interpolate(template: unknown, ctx: ExecutionContext): string {
  if (typeof template !== 'string') return String(template ?? '');
  const merged = {
    entityId: ctx.payload.entityId,
    projectId: ctx.projectId,
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    ...ctx.payload.metadata,
    ...ctx.payload.before,
    ...ctx.payload.after,
    ...ctx.variables,
  };
  return template.replace(/\{\{([\w.]+)\}\}/g, (_match, path: string) => {
    const value = path.split('.').reduce((acc: unknown, key) => {
      if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
      return undefined;
    }, merged as unknown);
    return value != null ? String(value) : '';
  });
}

// ─── task.update ──────────────────────────────────────────────────────────────

@Injectable()
export class UpdateTaskAction implements IAction {
  private readonly logger = new Logger(UpdateTaskAction.name);
  readonly key: ActionKey = 'task.update';
  readonly displayName = 'Update Task';

  constructor(private readonly prisma: PrismaService) {}

  async execute(params: Record<string, unknown>, ctx: ExecutionContext): Promise<unknown> {
    const taskId = interpolate(params.taskId ?? '{{entityId}}', ctx);
    const data: Record<string, unknown> = {};
    if (params.status) data.status = String(params.status);
    if (params.priority) data.priority = String(params.priority);
    if (params.title) data.title = interpolate(params.title, ctx);
    if (params.description) data.description = interpolate(params.description, ctx);
    if (params.dueDate) data.dueDate = new Date(interpolate(params.dueDate, ctx));

    const updated = await this.prisma.task.update({
      where: { id: taskId, tenantId: ctx.tenantId },
      data,
      select: { id: true, status: true, priority: true },
    });

    this.logger.debug(`[Execution ${ctx.executionId}] task.update → taskId=${updated.id}`);
    return { taskId: updated.id, fields: Object.keys(data) };
  }

  async executeDryRun(params: Record<string, unknown>, ctx: ExecutionContext): Promise<unknown> {
    const taskId = interpolate(params.taskId ?? '{{entityId}}', ctx);
    return { dryRun: true, action: 'task.update', taskId, changes: params };
  }
}

// ─── task.create ──────────────────────────────────────────────────────────────

@Injectable()
export class CreateTaskAction implements IAction {
  private readonly logger = new Logger(CreateTaskAction.name);
  readonly key: ActionKey = 'task.create';
  readonly displayName = 'Create Task';

  constructor(private readonly prisma: PrismaService) {}

  async execute(params: Record<string, unknown>, ctx: ExecutionContext): Promise<unknown> {
    const projectId = interpolate(params.projectId ?? '{{projectId}}', ctx);
    const created = await this.prisma.task.create({
      data: {
        tenantId: ctx.tenantId,
        projectId,
        title: interpolate(params.title ?? 'New Task', ctx),
        description: params.description ? interpolate(params.description, ctx) : undefined,
        status: String(params.status ?? 'todo'),
        priority: String(params.priority ?? 'medium'),
      },
      select: { id: true, title: true },
    });

    this.logger.debug(`[Execution ${ctx.executionId}] task.create → taskId=${created.id}`);
    // Expose the new task ID for downstream steps
    ctx.variables['createdTaskId'] = created.id;
    return { taskId: created.id, title: created.title };
  }

  async executeDryRun(params: Record<string, unknown>, ctx: ExecutionContext): Promise<unknown> {
    return {
      dryRun: true,
      action: 'task.create',
      projectId: ctx.projectId,
      title: interpolate(params.title ?? 'New Task', ctx),
    };
  }
}

// ─── task.assign ──────────────────────────────────────────────────────────────

@Injectable()
export class AssignTaskAction implements IAction {
  private readonly logger = new Logger(AssignTaskAction.name);
  readonly key: ActionKey = 'task.assign';
  readonly displayName = 'Assign Task';

  constructor(private readonly prisma: PrismaService) {}

  async execute(params: Record<string, unknown>, ctx: ExecutionContext): Promise<unknown> {
    const taskId = interpolate(params.taskId ?? '{{entityId}}', ctx);
    const userId = interpolate(params.userId as string, ctx);

    // Idempotent upsert — safe to retry
    await this.prisma.taskAssignee.upsert({
      where: {
        tenantId_taskId_userId: {
          taskId,
          userId,
          tenantId: ctx.tenantId,
        },
      },
      create: { taskId, userId, tenantId: ctx.tenantId },
      update: {},
    });

    this.logger.debug(`[Execution ${ctx.executionId}] task.assign → taskId=${taskId} userId=${userId}`);
    return { taskId, userId, assigned: true };
  }

  async executeDryRun(params: Record<string, unknown>, ctx: ExecutionContext): Promise<unknown> {
    const taskId = interpolate(params.taskId ?? '{{entityId}}', ctx);
    const userId = interpolate(params.userId as string, ctx);
    return { dryRun: true, action: 'task.assign', taskId, userId };
  }
}
