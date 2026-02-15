import { z } from 'zod';

/**
 * Environment variable validation schema.
 * Validates all required and optional env vars at startup.
 */
export const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  DATABASE_MAX_CONNECTIONS: z.coerce.number().int().min(1).max(100).default(10),

  // IAM / Auth
  IAM_AUTH_PROVIDER: z.enum(['local']).default('local'),
  IAM_JWT_SECRET: z.string().min(32, 'IAM_JWT_SECRET must be at least 32 characters'),
  IAM_COOKIE_SECRET: z.string().min(32, 'IAM_COOKIE_SECRET must be at least 32 characters'),
  IAM_ACCESS_TOKEN_TTL: z.coerce.number().int().min(60).default(900), // 15 minutes in seconds
  IAM_MAX_SESSION_TTL: z.coerce.number().int().min(3600).default(86400), // 24 hours in seconds

  // IAM Redis
  IAM_REDIS_HOST: z.string().default('localhost'),
  IAM_REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),
  IAM_REDIS_PASSWORD: z.string().optional(),

  // BullMQ Redis (for job queues)
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),
  REDIS_PASSWORD: z.string().optional(),

  // Server
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
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
