import type { WorkerOptions } from 'bullmq';

/**
 * Example queue configuration.
 * Contains queue name and worker options.
 */
export const EXAMPLE_QUEUE = {
  name: 'example',
  /**
   * Worker configuration for this queue.
   * Used by the processor in apps/worker.
   */
  workerOptions: {
    concurrency: 5,
    lockDuration: 60_000, // 1 minute
  } satisfies Partial<WorkerOptions>,
} as const;
