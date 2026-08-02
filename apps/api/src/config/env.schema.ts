import { z } from 'zod';

/**
 * Environment variable validation schema.
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
  DATABASE_MAX_CONNECTIONS: z.coerce.number().int().min(1).max(100).default(10),

  // IAM / Auth
  IAM_AUTH_PROVIDER: z.enum(['local']).default('local'),
  IAM_JWT_SECRET: z.string().min(32, 'IAM_JWT_SECRET must be at least 32 characters'),
  IAM_COOKIE_SECRET: z.string().min(32, 'IAM_COOKIE_SECRET must be at least 32 characters'),
  IAM_ACCESS_TOKEN_TTL: z.coerce.number().int().min(60).default(900), // 15 minutes in seconds
  // Absolute session lifetime — how long between typed passwords. Security is
  // carried by the short access token + revocation, not by forcing re-logins.
  IAM_MAX_SESSION_TTL: z.coerce.number().int().min(3600).default(2_592_000), // 30 days in seconds
  // How long a just-rotated refresh token still answers with its successor
  // pair (idempotent refresh) — covers concurrent refreshes and lost responses.
  IAM_REFRESH_GRACE_TTL: z.coerce.number().int().min(5).max(600).default(60),

  // IAM Redis
  IAM_REDIS_HOST: z.string().default('localhost'),
  IAM_REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),
  IAM_REDIS_PASSWORD: z.string().optional(),

  // BullMQ Redis (for job queues)
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),
  REDIS_PASSWORD: z.string().optional(),

  // Registration posture. CLOSED by default: most products gate account
  // creation behind onboarding/billing, and accounts otherwise come from the
  // seed or from org admins (user:create). Flip to 'true' for open signup.
  AUTH_REGISTRATION_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),

  // Behind a reverse proxy the client IP arrives in X-Forwarded-For; without
  // this every request appears to come from the proxy and rate limiting
  // throttles all users as one. Set 'true' in any proxied deployment.
  TRUST_PROXY: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),

  // Rate limiting (Redis-backed, so limits hold across replicas and restarts).
  // Disabled under NODE_ENV=test.
  // Optional dedicated Redis for the limiter. Unset → the IAM Redis is
  // reused, which is fine until the limiter's per-request INCRs deserve
  // isolation from session traffic. Counters are 60-second ephemera, so
  // pointing this at a fresh instance later migrates nothing.
  RATE_LIMIT_REDIS_HOST: z.string().optional(),
  RATE_LIMIT_REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),
  RATE_LIMIT_REDIS_PASSWORD: z.string().optional(),

  // The global default budget. Stricter per-route limits are declared at the
  // routes themselves with @Throttle (login/register: 10/min).
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(300),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(60_000),

  // MCP endpoint (/mcp) for agent access via API keys. OFF by default like
  // every capability here; keys are minted at /admin/api-keys, and each key's
  // scopes decide which tools it can see.
  MCP_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),

  // Object storage (S3-compatible; local rustfs in dev — see docs/storage.md).
  // Dev defaults line up with the rustfs block in compose.dev.yml.
  STORAGE_ENDPOINT: z.string().url().default('http://localhost:9000'),
  STORAGE_REGION: z.string().default('us-east-1'),
  STORAGE_ACCESS_KEY_ID: z.string().default('valmatic'),
  STORAGE_SECRET_ACCESS_KEY: z.string().default('valmatic'),
  STORAGE_BUCKET: z.string().default('valmatic-attachments'),
  // Comma-separated browser origins allowed to PUT/GET against presigned
  // URLs. A missing origin here is the classic silent upload-killer.
  STORAGE_CORS_ALLOWED_ORIGINS: z.string().default('http://localhost:5173'),

  // Telemetry — all optional; absent means the corresponding service is a
  // no-op. SENTRY_DSN wakes backend error reporting, POSTHOG_KEY wakes
  // product analytics and feature flags.
  SENTRY_DSN: z.string().url().optional(),
  POSTHOG_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().url().default('https://eu.i.posthog.com'),

  // Server
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),

  // Logging — show NestJS framework bootstrap logs (module/route mapping). Off by default.
  LOG_FRAMEWORK: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),

  // Seeding (initial login). Optional in dev (safe defaults applied by the seeder),
  // required in production — enforced by the superRefine below.
  SEED_INITIAL_EMAIL: z.string().email('SEED_INITIAL_EMAIL must be a valid email').optional(),
  SEED_INITIAL_PASSWORD: z
    .string()
    .min(8, 'SEED_INITIAL_PASSWORD must be at least 8 characters')
    .optional(),
  SEED_INITIAL_NAME: z.string().min(1).default('Initial Owner'),
  SEED_INITIAL_ORG_NAME: z.string().min(1).default('Valmonto'),
  /** When true, the API runs the seeder automatically on startup (handy for dev). */
  SEED_ON_STARTUP: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
}).superRefine((env, ctx) => {
  if (env.NODE_ENV !== 'production') return;

  for (const key of ['SEED_INITIAL_EMAIL', 'SEED_INITIAL_PASSWORD'] as const) {
    if (!env[key]) {
      ctx.addIssue({
        code: 'custom',
        path: [key],
        message: `${key} is required in production`,
      });
    }
  }
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
