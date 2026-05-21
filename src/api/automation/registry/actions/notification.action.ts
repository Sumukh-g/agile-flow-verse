import { Injectable, Logger } from '@nestjs/common';
import { IAction, ActionKey, ExecutionContext } from '../../types';
import { PrismaService } from '../../../prisma/prisma.service';

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

@Injectable()
export class CreateNotificationAction implements IAction {
  private readonly logger = new Logger(CreateNotificationAction.name);
  readonly key: ActionKey = 'notification.create';
  readonly displayName = 'Create In-App Notification';

  constructor(private readonly prisma: PrismaService) {}

  async execute(params: Record<string, unknown>, ctx: ExecutionContext): Promise<unknown> {
    /**
     * params.recipients: 'triggerer' | 'assignees' | string[] (userIds)
     *   - 'triggerer'  → ctx.userId
     *   - 'assignees'  → fetched from task/issue entity
     *   - string[]     → explicit list
     */
    const recipients = await this.resolveRecipients(params.recipients, ctx);
    const title = interpolate(params.title ?? 'Automation notification', ctx);
    const message = interpolate(params.message ?? '', ctx);
    const type = String(params.type ?? 'info');

    const created = await this.prisma.notification.createMany({
      data: recipients.map((userId) => ({
        tenantId: ctx.tenantId,
        userId,
        type,
        title,
        message,
        read: false,
      })),
      skipDuplicates: true,
    });

    this.logger.debug(
      `[Execution ${ctx.executionId}] notification.create → ${created.count} notification(s) sent`,
    );
    return { notificationsSent: created.count, recipients };
  }

  async executeDryRun(params: Record<string, unknown>, ctx: ExecutionContext): Promise<unknown> {
    const recipients = await this.resolveRecipients(params.recipients, ctx);
    return {
      dryRun: true,
      action: 'notification.create',
      would_notify: recipients,
      title: interpolate(params.title ?? '', ctx),
    };
  }

  private async resolveRecipients(
    recipients: unknown,
    ctx: ExecutionContext,
  ): Promise<string[]> {
    if (!recipients || recipients === 'triggerer') {
      return ctx.userId ? [ctx.userId] : [];
    }
    if (recipients === 'assignees') {
      const assignees = await this.prisma.taskAssignee.findMany({
        where: { taskId: ctx.payload.entityId, tenantId: ctx.tenantId },
        select: { userId: true },
      });
      return assignees.map((a) => a.userId);
    }
    if (Array.isArray(recipients)) {
      return recipients.map(String);
    }
    return [];
  }
}
