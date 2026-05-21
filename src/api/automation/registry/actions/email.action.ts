import { Injectable, Logger } from '@nestjs/common';
import { IAction, ActionKey, ExecutionContext } from '../../types';

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

/**
 * Sends an email via an SMTP/transactional provider.
 *
 * When ENABLE_EMAIL=false (default in dev), the email is logged but not sent.
 * Swap out the body of `deliverEmail` to integrate SendGrid / AWS SES / Resend, etc.
 */
@Injectable()
export class SendEmailAction implements IAction {
  private readonly logger = new Logger(SendEmailAction.name);
  readonly key: ActionKey = 'email.send';
  readonly displayName = 'Send Email';

  async execute(params: Record<string, unknown>, ctx: ExecutionContext): Promise<unknown> {
    const to = interpolate(params.to as string, ctx);
    const subject = interpolate(params.subject as string, ctx);
    const body = interpolate(params.body as string, ctx);

    const envelope = { to, subject, body };

    if (process.env.ENABLE_EMAIL === 'true') {
      await this.deliverEmail(envelope);
    } else {
      this.logger.log(
        `[Execution ${ctx.executionId}] email.send (ENABLE_EMAIL=false) → to=${to} subject="${subject}"`,
      );
    }

    return { to, subject, sent: process.env.ENABLE_EMAIL === 'true' };
  }

  async executeDryRun(params: Record<string, unknown>, ctx: ExecutionContext): Promise<unknown> {
    return {
      dryRun: true,
      action: 'email.send',
      to: interpolate(params.to as string, ctx),
      subject: interpolate(params.subject as string, ctx),
    };
  }

  /** Replace this method body to integrate a real email provider */
  private async deliverEmail(_envelope: { to: string; subject: string; body: string }): Promise<void> {
    // TODO: integrate transactional email (SendGrid, Resend, AWS SES)
    throw new Error('Email provider not configured. Set ENABLE_EMAIL=true and configure SMTP_* env vars.');
  }
}
