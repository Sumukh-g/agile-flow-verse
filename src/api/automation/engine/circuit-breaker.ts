import { Injectable, Logger } from '@nestjs/common';
import { RedisClient } from '../../common/redis/redis.client';
import { ExecutionContext, ChainContext } from '../types';

const MAX_CHAIN_DEPTH = 5;
/** Window in seconds for counting executions of the same rule */
const RATE_WINDOW_SECONDS = 60;
/** Maximum executions of the same rule per RATE_WINDOW_SECONDS */
const MAX_EXECUTIONS_PER_WINDOW = 50;

export class CircuitBreakerError extends Error {
  constructor(
    public readonly reason: 'loop_detected' | 'max_depth_exceeded' | 'rate_limit_exceeded',
    message: string,
  ) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

/**
 * Detects and breaks infinite automation loops.
 *
 * Three protection layers:
 *   1. Loop detection  — ruleId already appears in the current chain fingerprint
 *   2. Depth limit     — chain depth exceeds MAX_CHAIN_DEPTH
 *   3. Rate limiter    — same rule fires more than MAX_EXECUTIONS_PER_WINDOW times per minute
 */
@Injectable()
export class CircuitBreaker {
  private readonly logger = new Logger(CircuitBreaker.name);

  constructor(private readonly redis: RedisClient) {}

  /**
   * Throws CircuitBreakerError if execution should be halted.
   * Call this before executing any rule.
   */
  async guard(context: ExecutionContext): Promise<void> {
    this.checkDepth(context.chain);
    this.checkLoop(context.ruleId, context.chain);
    await this.checkRateLimit(context.ruleId, context.tenantId);
  }

  /** Returns the ChainContext for a rule that was triggered BY another rule */
  buildChildChain(parentChain: ChainContext, triggeredByRuleId: string): ChainContext {
    return {
      depth: parentChain.depth + 1,
      fingerprint: [...parentChain.fingerprint, triggeredByRuleId],
    };
  }

  /** Returns a fresh root ChainContext (for event-driven triggers, not sub-triggers) */
  buildRootChain(): ChainContext {
    return { depth: 0, fingerprint: [] };
  }

  private checkDepth(chain: ChainContext): void {
    if (chain.depth > MAX_CHAIN_DEPTH) {
      throw new CircuitBreakerError(
        'max_depth_exceeded',
        `Automation chain depth ${chain.depth} exceeds maximum of ${MAX_CHAIN_DEPTH}`,
      );
    }
  }

  private checkLoop(ruleId: string, chain: ChainContext): void {
    if (chain.fingerprint.includes(ruleId)) {
      throw new CircuitBreakerError(
        'loop_detected',
        `Infinite loop detected: rule "${ruleId}" already appears in chain [${chain.fingerprint.join(' → ')}]`,
      );
    }
  }

  private async checkRateLimit(ruleId: string, tenantId: string): Promise<void> {
    const key = `automation:rate:${tenantId}:${ruleId}`;
    try {
      const count = await this.redis.incr(key);
      if (count === 1) {
        // First execution in this window — set TTL
        await this.redis.expire(key, RATE_WINDOW_SECONDS);
      }
      if (count > MAX_EXECUTIONS_PER_WINDOW) {
        this.logger.warn(
          `Rate limit exceeded for rule ${ruleId} in tenant ${tenantId}: ${count} executions in ${RATE_WINDOW_SECONDS}s`,
        );
        throw new CircuitBreakerError(
          'rate_limit_exceeded',
          `Rule "${ruleId}" exceeded ${MAX_EXECUTIONS_PER_WINDOW} executions per ${RATE_WINDOW_SECONDS}s`,
        );
      }
    } catch (err) {
      if (err instanceof CircuitBreakerError) throw err;
      // Redis unavailable — allow execution to proceed (fail open)
      this.logger.warn(`CircuitBreaker rate-limit check failed (Redis unavailable): ${(err as Error).message}`);
    }
  }
}
