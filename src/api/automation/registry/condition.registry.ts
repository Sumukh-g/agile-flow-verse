import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ICondition, ConditionKey } from '../types';

/**
 * Central registry for all Condition handlers.
 *
 * Adding a new condition = implementing ICondition + one registration line.
 */
@Injectable()
export class ConditionRegistry {
  private readonly logger = new Logger(ConditionRegistry.name);
  private readonly handlers = new Map<ConditionKey, ICondition>();

  register(condition: ICondition): void {
    if (this.handlers.has(condition.key)) {
      this.logger.warn(`Condition "${condition.key}" is being overwritten in the registry`);
    }
    this.handlers.set(condition.key, condition);
    this.logger.debug(`Registered condition: ${condition.key}`);
  }

  get(key: ConditionKey): ICondition {
    const handler = this.handlers.get(key);
    if (!handler) {
      throw new NotFoundException(`No condition handler registered for key: "${key}"`);
    }
    return handler;
  }

  getAll(): ICondition[] {
    return Array.from(this.handlers.values());
  }

  getCatalog(): Array<{ key: ConditionKey; displayName: string }> {
    return this.getAll().map((c) => ({ key: c.key, displayName: c.displayName }));
  }
}
