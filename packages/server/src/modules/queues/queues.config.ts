import type { RegisterQueueOptions } from '@nestjs/bullmq';

/**
 * Shared Redis connection config for BullMQ.
 * Uses environment variables with sensible defaults.
 */
export interface RedisConnectionConfig {
  host: string;
  port: number;
  password: string | undefined;
  /** BullMQ requires this to be null: it manages retries itself. */
  maxRetriesPerRequest: null;
}

export function getRedisConfig(): RedisConnectionConfig {
  return {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null, // Required for BullMQ
  };
}

/**
 * Default job options applied to all queues.
 *
 * A finished job is kept only while it is among the most recent hundred of
 * its queue — enough to tell when a queue last finished something, without
 * Redis growing with every run. A failed job is kept for inspection until it
 * is no longer among the most recent 500 failures of its queue — a job that
 * fails every few minutes for weeks must not fill Redis while nobody looks.
 */
export const DEFAULT_JOB_OPTIONS: RegisterQueueOptions['defaultJobOptions'] = {
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
};
