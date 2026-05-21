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
export class CreateCommentAction implements IAction {
  private readonly logger = new Logger(CreateCommentAction.name);
  readonly key: ActionKey = 'comment.create';
  readonly displayName = 'Create Comment';

  constructor(private readonly prisma: PrismaService) {}

  async execute(params: Record<string, unknown>, ctx: ExecutionContext): Promise<unknown> {
    const entityId = interpolate(params.entityId ?? '{{entityId}}', ctx);
    const content = interpolate(params.content as string, ctx);
    const entityType = String(params.entityType ?? ctx.payload.entityType ?? 'issue');

    // Use specified author, fall back to the triggering user, then any tenant user
    let createdBy = ctx.userId;
    if (!createdBy) {
      const fallbackUser = await this.prisma.user.findFirst({
        where: { tenantId: ctx.tenantId },
        select: { id: true },
      });
      createdBy = fallbackUser?.id;
    }
    if (!createdBy) throw new Error('Cannot create comment: no author found');

    const comment = await this.prisma.comment.create({
      data: {
        tenantId: ctx.tenantId,
        createdBy,
        content,
        // Route to the correct relation based on entity type
        ...(entityType === 'issue' ? { issueId: entityId } : {}),
        ...(entityType === 'note' ? { noteId: entityId } : {}),
      },
      select: { id: true },
    });

    this.logger.debug(`[Execution ${ctx.executionId}] comment.create → commentId=${comment.id}`);
    return { commentId: comment.id, entityId, entityType };
  }

  async executeDryRun(params: Record<string, unknown>, ctx: ExecutionContext): Promise<unknown> {
    const entityId = interpolate(params.entityId ?? '{{entityId}}', ctx);
    const content = interpolate(params.content as string, ctx);
    return { dryRun: true, action: 'comment.create', entityId, content };
  }
}
