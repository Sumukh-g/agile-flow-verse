import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { AutomationRunner } from '../engine/automation.runner';
import { AutomationJobData } from '../types';
import { AUTOMATION_QUEUE } from './automation.queue';

/**
 * BullMQ worker that processes automation execution jobs from the queue.
 *
 * Each job corresponds to one AutomationExecution record.
 * Retries are handled by BullMQ (see AUTOMATION_JOB_OPTIONS).
 * The runner is idempotent — re-running a job that already completed is a no-op.
 */
@Processor(AUTOMATION_QUEUE)
export class AutomationProcessor extends WorkerHost {
  private readonly logger = new Logger(AutomationProcessor.name);

  constructor(private readonly runner: AutomationRunner) {
    super();
  }

  async process(job: Job<AutomationJobData>): Promise<void> {
    this.logger.debug(
      `Processing job ${job.id} (attempt ${job.attemptsMade + 1}): ruleId=${job.data.ruleId}`,
    );

    try {
      await this.runner.run(job.data);
    } catch (err) {
      this.logger.error(
        `Job ${job.id} failed on attempt ${job.attemptsMade + 1}: ${(err as Error).message}`,
        (err as Error).stack,
      );
      // Re-throw so BullMQ schedules a retry
      throw err;
    }
  }
}
