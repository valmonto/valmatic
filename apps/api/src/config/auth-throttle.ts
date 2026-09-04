/**
 * The spray limit for login/register: per IP, per minute.
 *
 * `@Throttle` metadata is fixed at decoration time, before ConfigModule has
 * validated anything, so the limit is a resolver read on each request. The
 * schema (env.schema.ts) validates AUTH_RATE_LIMIT_MAX; this only reads it.
 * Unset → 10, the production posture. The e2e stack raises it because its
 * whole suite (plus Playwright retries) logs in from one address and would
 * otherwise throttle itself.
 */
export const AUTH_RATE_LIMIT_DEFAULT = 10;

export function authRateLimitMax(): number {
  const raw = Number(process.env.AUTH_RATE_LIMIT_MAX);
  return Number.isInteger(raw) && raw >= 1 ? raw : AUTH_RATE_LIMIT_DEFAULT;
}

export const AUTH_THROTTLE = { default: { limit: authRateLimitMax, ttl: 60_000 } };
