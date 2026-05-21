import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConditionEvaluator } from './condition.evaluator';
import { CircuitBreaker, CircuitBreakerError } from './circuit-breaker';
import { ActionRegistry } from '../registry/action.registry';
import {
  AutomationJobData,
  ExecutionContext,
  ActionStep,
  ActionLeaf,
  BranchNode,
  StepResult,
} from '../types';

const AUTOMATION_EXECUTION_STATUS = {
  RUNNING: 'RUNNING' as const,
  SUCCESS: 'SUCCESS' as const,
  FAILED: 'FAILED' as const,
  SKIPPED: 'SKIPPED' as const,
  DRY_RUN: 'DRY_RUN' as const,
};

/**
 * Core automation execution engine.
 *
 * Responsibilities:
 *   1. Load the AutomationRule from the DB
 *   2. Run the CircuitBreaker guard
 *   3. Evaluate global conditions
 *   4. Iterate & execute steps (actions + if/then/else branches)
 *   5. Write granular AutomationStepLog rows for every step
 *   6. Update the AutomationExecution record with final status
 */
@Injectable()
export class AutomationRunner {
  private readonly logger = new Logger(AutomationRunner.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly conditionEvaluator: ConditionEvaluator,
    private readonly circuitBreaker: CircuitBreaker,
    private readonly actionRegistry: ActionRegistry,
  ) {}

  async run(job: AutomationJobData): Promise<void> {
    const { ruleId, executionId, triggerPayload, isDryRun, chain } = job;

    const execution = await this.prisma.automationExecution.findUnique({
      where: { id: executionId },
    });
    if (!execution) {
      this.logger.warn(`Execution record ${executionId} not found — skipping`);
      return;
    }

    const rule = await this.prisma.automationRule.findUnique({
      where: { id: ruleId },
    });
    if (!rule || !rule.isActive) {
      await this.markExecution(executionId, 'SKIPPED', 'Rule not found or inactive');
      return;
    }

    const context: ExecutionContext = {
      ruleId,
      executionId,
      tenantId: triggerPayload.tenantId,
      projectId: triggerPayload.projectId ?? (rule.projectId ?? undefined),
      userId: triggerPayload.userId,
      isDryRun,
      chain,
      payload: triggerPayload,
      variables: {},
    };

    // ── Circuit Breaker ───────────────────────────────────────────────────────
    try {
      await this.circuitBreaker.guard(context);
    } catch (err) {
      if (err instanceof CircuitBreakerError) {
        this.logger.warn(
          `[Execution ${executionId}] CircuitBreaker stopped rule "${ruleId}": ${err.message}`,
        );
        await this.markExecution(executionId, 'FAILED', err.message);
        return;
      }
      throw err;
    }

    // ── Mark execution as RUNNING ─────────────────────────────────────────────
    await this.prisma.automationExecution.update({
      where: { id: executionId },
      data: { status: AUTOMATION_EXECUTION_STATUS.RUNNING, startedAt: new Date() },
    });

    const startTime = Date.now();
    let stepIndex = 0;

    try {
      // ── Global pre-conditions ───────────────────────────────────────────────
      if (rule.conditions) {
        const conditionsNode = rule.conditions as unknown as Parameters<ConditionEvaluator['evaluate']>[0];
        const condStepStart = Date.now();
        const passed = await this.conditionEvaluator.evaluate(conditionsNode, context);
        const condDuration = Date.now() - condStepStart;

        await this.logStep({
          executionId,
          stepIndex: stepIndex++,
          stepType: 'CONDITION',
          stepKey: 'global.precondition',
          status: passed ? 'SUCCESS' : 'SKIPPED',
          inputPayload: rule.conditions as object,
          outputPayload: { result: passed },
          durationMs: condDuration,
        });

        if (!passed) {
          await this.markExecution(executionId, 'SKIPPED', 'Global preconditions not met');
          return;
        }
      }

      // ── Execute steps ───────────────────────────────────────────────────────
      const steps = rule.steps as unknown as ActionStep[];
      for (const step of steps) {
        const result = await this.executeStep(step, context, stepIndex);
        stepIndex++;

        if (result.status === 'failed') {
          const isActionLeaf = step.type === 'action';
          const continueOnFailure =
            isActionLeaf && (step as ActionLeaf).continueOnFailure === true;

          if (!continueOnFailure) {
            throw result.error ?? new Error(`Step ${stepIndex - 1} failed`);
          }
          this.logger.warn(
            `[Execution ${executionId}] Step ${stepIndex - 1} failed but continueOnFailure=true`,
          );
        }
      }

      const totalDuration = Date.now() - startTime;
      await this.prisma.automationExecution.update({
        where: { id: executionId },
        data: {
          status: isDryRun
            ? AUTOMATION_EXECUTION_STATUS.DRY_RUN
            : AUTOMATION_EXECUTION_STATUS.SUCCESS,
          completedAt: new Date(),
          durationMs: totalDuration,
        },
      });

      this.logger.log(
        `[Execution ${executionId}] Rule "${ruleId}" completed ${isDryRun ? '(DRY RUN)' : 'successfully'} in ${totalDuration}ms`,
      );
    } catch (err) {
      const totalDuration = Date.now() - startTime;
      const message = (err as Error).message;
      const stack = (err as Error).stack;

      this.logger.error(
        `[Execution ${executionId}] Rule "${ruleId}" failed: ${message}`,
        stack,
      );

      await this.prisma.automationExecution.update({
        where: { id: executionId },
        data: {
          status: AUTOMATION_EXECUTION_STATUS.FAILED,
          completedAt: new Date(),
          durationMs: totalDuration,
          errorMessage: message,
        },
      });
    }
  }

  // ─── Step Execution ─────────────────────────────────────────────────────────

  private async executeStep(
    step: ActionStep,
    context: ExecutionContext,
    stepIndex: number,
  ): Promise<StepResult> {
    if (step.type === 'action') {
      return this.executeActionLeaf(step, context, stepIndex);
    }
    if (step.type === 'branch') {
      return this.executeBranchNode(step, context, stepIndex);
    }
    return { status: 'skipped', durationMs: 0 };
  }

  private async executeActionLeaf(
    leaf: ActionLeaf,
    context: ExecutionContext,
    stepIndex: number,
  ): Promise<StepResult> {
    const handler = this.actionRegistry.get(leaf.key);
    const start = Date.now();

    try {
      const output = context.isDryRun
        ? await handler.executeDryRun(leaf.params, context)
        : await handler.execute(leaf.params, context);

      const durationMs = Date.now() - start;
      const status = context.isDryRun ? 'dry_run' : 'success';

      await this.logStep({
        executionId: context.executionId,
        stepIndex,
        stepType: 'ACTION',
        stepKey: leaf.key,
        status: status.toUpperCase() as 'SUCCESS' | 'DRY_RUN',
        inputPayload: leaf.params,
        outputPayload: output as object,
        durationMs,
      });

      return { status, output, durationMs };
    } catch (err) {
      const durationMs = Date.now() - start;
      const error = err as Error;

      await this.logStep({
        executionId: context.executionId,
        stepIndex,
        stepType: 'ACTION',
        stepKey: leaf.key,
        status: 'FAILED',
        inputPayload: leaf.params,
        errorMessage: error.message,
        errorStack: error.stack,
        durationMs,
      });

      return { status: 'failed', error, durationMs };
    }
  }

  private async executeBranchNode(
    branch: BranchNode,
    context: ExecutionContext,
    stepIndex: number,
  ): Promise<StepResult> {
    const start = Date.now();
    let branchTaken: 'then' | 'else' | 'none' = 'none';

    try {
      const conditionMet = await this.conditionEvaluator.evaluate(
        branch.condition,
        context,
      );

      const stepsToRun = conditionMet ? branch.then : (branch.else ?? []);
      branchTaken = conditionMet ? 'then' : branch.else ? 'else' : 'none';

      // Record the branch decision
      await this.logStep({
        executionId: context.executionId,
        stepIndex,
        stepType: 'BRANCH',
        stepKey: 'branch',
        status: 'SUCCESS',
        inputPayload: { condition: branch.condition },
        outputPayload: { conditionMet, branchTaken },
        durationMs: Date.now() - start,
      });

      // Execute nested steps inline (they get their own step logs)
      let nestedIndex = stepIndex + 0.1; // floating index for nested steps
      for (const nestedStep of stepsToRun) {
        const result = await this.executeStep(nestedStep, context, Math.floor(nestedIndex));
        nestedIndex += 0.1;
        if (result.status === 'failed') {
          const isLeaf = nestedStep.type === 'action';
          if (!isLeaf || !(nestedStep as ActionLeaf).continueOnFailure) {
            return result;
          }
        }
      }

      return { status: 'success', output: { branchTaken }, durationMs: Date.now() - start };
    } catch (err) {
      const error = err as Error;
      await this.logStep({
        executionId: context.executionId,
        stepIndex,
        stepType: 'BRANCH',
        stepKey: 'branch',
        status: 'FAILED',
        inputPayload: { condition: branch.condition },
        errorMessage: error.message,
        errorStack: error.stack,
        durationMs: Date.now() - start,
      });
      return { status: 'failed', error, durationMs: Date.now() - start };
    }
  }

  // ─── DB Helpers ─────────────────────────────────────────────────────────────

  private async markExecution(
    executionId: string,
    status: 'SKIPPED' | 'FAILED',
    reason: string,
  ): Promise<void> {
    await this.prisma.automationExecution.update({
      where: { id: executionId },
      data: {
        status,
        completedAt: new Date(),
        errorMessage: reason,
      },
    });
  }

  private async logStep(params: {
    executionId: string;
    stepIndex: number;
    stepType: 'CONDITION' | 'ACTION' | 'BRANCH';
    stepKey: string;
    status: 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'DRY_RUN';
    inputPayload: object;
    outputPayload?: object;
    errorMessage?: string;
    errorStack?: string;
    durationMs: number;
  }): Promise<void> {
    try {
      await this.prisma.automationStepLog.create({
        data: {
          executionId: params.executionId,
          stepIndex: params.stepIndex,
          stepType: params.stepType,
          stepKey: params.stepKey,
          status: params.status,
          inputPayload: params.inputPayload,
          outputPayload: params.outputPayload ?? undefined,
          errorMessage: params.errorMessage,
          errorStack: params.errorStack,
          durationMs: params.durationMs,
        },
      });
    } catch (err) {
      // Never let logging failures break execution
      this.logger.error(`Failed to write step log for ${params.executionId}: ${(err as Error).message}`);
    }
  }
}
