import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { IAction, ActionKey } from '../types';

/**
 * Central registry for all Action handlers.
 *
 * Adding a new action = implementing IAction + one registration line.
 */
@Injectable()
export class ActionRegistry {
  private readonly logger = new Logger(ActionRegistry.name);
  private readonly handlers = new Map<ActionKey, IAction>();

  register(action: IAction): void {
    if (this.handlers.has(action.key)) {
      this.logger.warn(`Action "${action.key}" is being overwritten in the registry`);
    }
    this.handlers.set(action.key, action);
    this.logger.debug(`Registered action: ${action.key}`);
  }

  get(key: ActionKey): IAction {
    const handler = this.handlers.get(key);
    if (!handler) {
      throw new NotFoundException(`No action handler registered for key: "${key}"`);
    }
    return handler;
  }

  getAll(): IAction[] {
    return Array.from(this.handlers.values());
  }

  getCatalog(): Array<{ key: ActionKey; displayName: string }> {
    return this.getAll().map((a) => ({ key: a.key, displayName: a.displayName }));
  }
}
