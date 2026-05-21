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

@Injectable()
export class SendWebhookAction implements IAction {
  private readonly logger = new Logger(SendWebhookAction.name);
  readonly key: ActionKey = 'webhook.send';
  readonly displayName = 'Send Webhook';

  async execute(params: Record<string, unknown>, ctx: ExecutionContext): Promise<unknown> {
    const url = interpolate(params.url as string, ctx);
    const method = String(params.method ?? 'POST').toUpperCase();
    const extraHeaders = (params.headers as Record<string, string>) ?? {};

    const body = this.buildBody(params.body, ctx);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-AgileFlow-ExecutionId': ctx.executionId,
          ...extraHeaders,
        },
        body: method !== 'GET' ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      const responseText = await response.text().catch(() => '');
      if (!response.ok) {
        throw new Error(
          `Webhook responded with ${response.status} ${response.statusText}: ${responseText}`,
        );
      }

      this.logger.debug(
        `[Execution ${ctx.executionId}] webhook.send → ${method} ${url} ${response.status}`,
      );
      return { url, method, status: response.status, responseBody: responseText.slice(0, 512) };
    } finally {
      clearTimeout(timeout);
    }
  }

  async executeDryRun(params: Record<string, unknown>, ctx: ExecutionContext): Promise<unknown> {
    const url = interpolate(params.url as string, ctx);
    const method = String(params.method ?? 'POST').toUpperCase();
    const body = this.buildBody(params.body, ctx);
    return { dryRun: true, action: 'webhook.send', url, method, body };
  }

  private buildBody(bodyTemplate: unknown, ctx: ExecutionContext): unknown {
    if (!bodyTemplate) {
      return {
        executionId: ctx.executionId,
        ruleId: ctx.ruleId,
        event: ctx.payload.event,
        entityId: ctx.payload.entityId,
        tenantId: ctx.tenantId,
        payload: ctx.payload,
      };
    }
    if (typeof bodyTemplate === 'object') {
      return JSON.parse(interpolate(JSON.stringify(bodyTemplate), ctx));
    }
    return bodyTemplate;
  }
}
