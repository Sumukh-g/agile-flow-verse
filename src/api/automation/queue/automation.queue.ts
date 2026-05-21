/** Queue name constant — single source of truth for both producer and processor */
export const AUTOMATION_QUEUE = 'automation';

/** Default BullMQ job options for automation jobs */
export const AUTOMATION_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 2_000,
  },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
} as const;
