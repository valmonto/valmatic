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
 */
export const DEFAULT_JOB_OPTIONS: RegisterQueueOptions['defaultJobOptions'] = {
  removeOnComplete: true,
  removeOnFail: false,
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
};
