import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
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
 * Sends an email via an SMTP provider (nodemailer).
 *
 * Behaviour:
 * - ENABLE_EMAIL != 'true' (default in dev): the email is logged, not sent.
 * - ENABLE_EMAIL == 'true' AND SMTP configured: the email is delivered.
 * - ENABLE_EMAIL == 'true' BUT SMTP not configured: we log a warning and skip
 *   delivery instead of throwing, so a misconfiguration never crashes an
 *   otherwise-valid automation run. The skip is surfaced in the return payload.
 */
@Injectable()
export class SendEmailAction implements IAction {
  private readonly logger = new Logger(SendEmailAction.name);
  readonly key: ActionKey = 'email.send';
  readonly displayName = 'Send Email';

  private transporter: Transporter | null = null;

  async execute(params: Record<string, unknown>, ctx: ExecutionContext): Promise<unknown> {
    const to = interpolate(params.to as string, ctx);
    const subject = interpolate(params.subject as string, ctx);
    const body = interpolate(params.body as string, ctx);

    const envelope = { to, subject, body };

    if (process.env.ENABLE_EMAIL !== 'true') {
      this.logger.log(
        `[Execution ${ctx.executionId}] email.send (ENABLE_EMAIL!=true) → to=${to} subject="${subject}"`,
      );
      return { to, subject, sent: false, skipped: true, reason: 'email_disabled' };
    }

    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.warn(
        `[Execution ${ctx.executionId}] email.send skipped: ENABLE_EMAIL=true but SMTP_* env vars are not configured. Email to=${to} was not sent.`,
      );
      return { to, subject, sent: false, skipped: true, reason: 'smtp_not_configured' };
    }

    await this.deliverEmail(transporter, envelope);
    return { to, subject, sent: true };
  }

  async executeDryRun(params: Record<string, unknown>, ctx: ExecutionContext): Promise<unknown> {
    return {
      dryRun: true,
      action: 'email.send',
      to: interpolate(params.to as string, ctx),
      subject: interpolate(params.subject as string, ctx),
    };
  }

  /**
   * Lazily build (and cache) an SMTP transporter from SMTP_* env vars.
   * Returns null when the minimum configuration (host) is absent.
   */
  private getTransporter(): Transporter | null {
    if (this.transporter) return this.transporter;

    const host = process.env.SMTP_HOST;
    if (!host) return null;

    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      // 465 is implicit TLS; other ports use STARTTLS.
      secure: port === 465,
      ...(user && pass ? { auth: { user, pass } } : {}),
    });

    return this.transporter;
  }

  private async deliverEmail(
    transporter: Transporter,
    envelope: { to: string; subject: string; body: string },
  ): Promise<void> {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@agileflow.local';
    await transporter.sendMail({
      from,
      to: envelope.to,
      subject: envelope.subject,
      text: envelope.body,
    });
  }
}
