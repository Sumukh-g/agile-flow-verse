import { Injectable, Logger } from '@nestjs/common';
import { ConditionNode, ConditionLeaf, ConditionGroup, ExecutionContext } from '../types';
import { ConditionRegistry } from '../registry/condition.registry';

/**
 * Recursively evaluates a ConditionNode tree against the ExecutionContext.
 *
 * Supported tree shapes:
 *   - leaf  → delegates to a registered ICondition handler
 *   - group → AND / OR / NOT over a list of children
 *
 * Short-circuits where possible (AND stops on first false, OR stops on first true).
 */
@Injectable()
export class ConditionEvaluator {
  private readonly logger = new Logger(ConditionEvaluator.name);

  constructor(private readonly conditionRegistry: ConditionRegistry) {}

  async evaluate(node: ConditionNode, context: ExecutionContext): Promise<boolean> {
    if (node.type === 'leaf') {
      return this.evaluateLeaf(node, context);
    }
    return this.evaluateGroup(node, context);
  }

  private async evaluateLeaf(leaf: ConditionLeaf, context: ExecutionContext): Promise<boolean> {
    const handler = this.conditionRegistry.get(leaf.key);
    try {
      const result = await handler.evaluate(leaf.params, context);
      this.logger.debug(
        `[Execution ${context.executionId}] condition "${leaf.key}" → ${result}`,
      );
      return result;
    } catch (err) {
      this.logger.error(
        `[Execution ${context.executionId}] condition "${leaf.key}" threw: ${(err as Error).message}`,
      );
      return false;
    }
  }

  private async evaluateGroup(group: ConditionGroup, context: ExecutionContext): Promise<boolean> {
    const { operator, children } = group;

    if (operator === 'NOT') {
      if (children.length !== 1) {
        this.logger.warn('NOT group must have exactly one child; treating as false');
        return false;
      }
      return !(await this.evaluate(children[0], context));
    }

    if (operator === 'AND') {
      for (const child of children) {
        if (!(await this.evaluate(child, context))) return false;
      }
      return true;
    }

    if (operator === 'OR') {
      for (const child of children) {
        if (await this.evaluate(child, context)) return true;
      }
      return false;
    }

    this.logger.warn(`Unknown logical operator "${operator}"; treating as false`);
    return false;
  }
}
