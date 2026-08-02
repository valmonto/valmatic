import { z } from 'zod';

/**
 * Environment variable validation schema for the worker.
 * Validates all required and optional env vars at startup.
 */
export const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  // `.url()` alone accepts anything with a scheme — "A:" passes — so a typo'd
  // connection string survives startup and only fails on the first query.
  DATABASE_URL: z
    .string()
    .regex(/^postgres(ql)?:\/\/.+/, 'DATABASE_URL must be a valid postgres:// connection URL'),
  DATABASE_MAX_CONNECTIONS: z.coerce.number().int().min(1).max(100).default(5),

  // BullMQ Redis (for job queues)
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),
  REDIS_PASSWORD: z.string().optional(),

  // Object storage (S3-compatible) — the attachments sweep deletes objects.
  // Same values the API uses; see docs/storage.md.
  STORAGE_ENDPOINT: z.string().url().default('http://localhost:9000'),
  STORAGE_REGION: z.string().default('us-east-1'),
  STORAGE_ACCESS_KEY_ID: z.string().default('valmatic'),
  STORAGE_SECRET_ACCESS_KEY: z.string().default('valmatic'),
  STORAGE_BUCKET: z.string().default('valmatic-attachments'),

  // Worker
  WORKER_PORT: z.coerce.number().int().min(1).max(65535).default(3001),

  // Logging — show NestJS framework bootstrap logs (module/route mapping). Off by default.
  LOG_FRAMEWORK: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),

  // Telemetry — optional; absent = no-op
  SENTRY_DSN: z.string().url().optional(),
  POSTHOG_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().url().default('https://eu.i.posthog.com'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables and returns typed config.
 * Throws descriptive errors if validation fails.
 */
export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(`Environment validation failed:\n${errors}`);
  }

  return result.data;
}
