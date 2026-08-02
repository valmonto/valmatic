import type { WorkerOptions } from 'bullmq';

/**
 * Attachments sweep — the storage GC (docs/storage.md §3). One repeatable
 * job; three predicates: stale pendings, expiries, aged soft-deletes.
 */
export const ATTACHMENTS_SWEEP_QUEUE = {
  name: 'attachments-sweep',
  /** The sweep is idempotent housekeeping — one at a time is plenty. */
  workerOptions: {
    concurrency: 1,
    lockDuration: 120_000,
  } satisfies Partial<WorkerOptions>,
  repeatEveryMs: 15 * 60 * 1000,
  /** Rows handled per predicate per run — bounded so a backlog can't stall a tick. */
  batchSize: 100,
  pendingMaxAgeHours: 24,
  softDeletedRetentionDays: 7,
} as const;
