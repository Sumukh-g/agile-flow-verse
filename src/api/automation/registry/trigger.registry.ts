import { Injectable, Logger } from '@nestjs/common';
import { ITrigger, TriggerKey, TriggerPayload } from '../types';

/**
 * Central registry for all Trigger handlers.
 *
 * Handlers are registered at module bootstrap time via AutomationModule.
 * Registering a new trigger = implementing ITrigger + adding one line in the module.
 */
@Injectable()
export class TriggerRegistry {
  private readonly logger = new Logger(TriggerRegistry.name);
  private readonly handlers = new Map<TriggerKey, ITrigger>();

  register(trigger: ITrigger): void {
    if (this.handlers.has(trigger.key)) {
      this.logger.warn(`Trigger "${trigger.key}" is being overwritten in the registry`);
    }
    this.handlers.set(trigger.key, trigger);
    this.logger.debug(`Registered trigger: ${trigger.key}`);
  }

  get(key: TriggerKey): ITrigger | undefined {
    return this.handlers.get(key);
  }

  /** Returns all triggers whose key matches the event in the payload */
  findMatching(payload: TriggerPayload, params: Record<string, unknown>): ITrigger[] {
    const handler = this.handlers.get(payload.event);
    if (!handler) return [];
    return handler.matches(payload, params) ? [handler] : [];
  }

  getAll(): ITrigger[] {
    return Array.from(this.handlers.values());
  }

  getCatalog(): Array<{ key: TriggerKey; displayName: string; description: string }> {
    return this.getAll().map((t) => ({
      key: t.key,
      displayName: t.displayName,
      description: t.description,
    }));
  }
}
