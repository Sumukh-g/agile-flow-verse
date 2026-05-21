import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AutomationJobData } from '../types';
import { AutomationRunner } from '../engine/automation.runner';
import { AUTOMATION_QUEUE, AUTOMATION_JOB_OPTIONS } from './automation.queue';

/**
 * Enqueues automation execution jobs.
 *
 * Strategy:
 *   - When Redis is available (REDIS_URL set): jobs are enqueued via BullMQ
 *     → persisted, retried on failure, processed by AutomationProcessor worker.
 *   - When Redis is unavailable (dev/test): jobs are executed directly via
 *     setImmediate() — non-blocking but not persisted/retried.
 */
@Injectable()
export class AutomationProducer {
  private readonly logger = new Logger(AutomationProducer.name);
  private useFallback: boolean;

  constructor(
    @Optional() @InjectQueue(AUTOMATION_QUEUE) private readonly queue: Queue | null,
    private readonly runner: AutomationRunner,
  ) {
    this.useFallback = !queue || !process.env.REDIS_URL;
    if (this.useFallback) {
      this.logger.warn(
        'AutomationProducer: Redis not configured — using in-process fallback (no persistence/retries)',
      );
    }
  }

  async enqueue(job: AutomationJobData): Promise<void> {
    if (this.useFallback) {
      this.runInProcess(job);
      return;
    }

    try {
      await this.queue!.add('execute', job, {
        ...AUTOMATION_JOB_OPTIONS,
        // Use the executionId as the BullMQ job ID for idempotency at the queue layer.
        // BullMQ will silently ignore duplicate adds with the same jobId.
        jobId: job.executionId,
      });
      this.logger.debug(`Enqueued automation job ${job.executionId} for rule ${job.ruleId}`);
    } catch (err) {
      this.logger.error(
        `Failed to enqueue job ${job.executionId} via BullMQ: ${(err as Error).message}. Falling back to in-process execution.`,
      );
      this.useFallback = true;
      this.runInProcess(job);
    }
  }

  /** Non-blocking in-process execution for environments without Redis */
  private runInProcess(job: AutomationJobData): void {
    setImmediate(() => {
      this.runner.run(job).catch((err) => {
        this.logger.error(
          `In-process execution failed for job ${job.executionId}: ${(err as Error).message}`,
        );
      });
    });
  }
}
