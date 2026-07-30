import { createHash } from 'node:crypto';
import { k } from '@pkg/locales';

/**
 * Rate-limit policy, extracted from main.ts so the key and max decisions are
 * unit-testable. The plugin itself is registered at bootstrap with a Redis
 * store — in-memory counters would multiply the real limit by the number of
 * replicas and reset on every restart, exactly when an attacker retries.
 */

export interface RateLimitEnv {
  max: number;
  authMax: number;
  windowMs: number;
}

interface KeyableRequest {
  ip: string;
  url: string;
  cookies?: Record<string, string | undefined>;
}

/** The unauthenticated endpoints worth spraying — limited strictly, per IP. */
export function isStrictAuthRoute(url: string): boolean {
  const path = url.split('?')[0];
  return path === '/api/auth/login' || path === '/api/auth/register';
}

/**
 * Bucket key.
 *
 * Auth endpoints: the IP alone, always — there is no user yet, and letting
 * anything else into the key would let an attacker mint fresh buckets.
 *
 * Everything else: IP + a hash of the session cookie when present. The cookie
 * half exists for carrier NAT — thousands of mobile users share one IP, and
 * pure-IP buckets would let them exhaust each other's quota. The trade-off is
 * honest: a client rotating garbage cookies from one IP can spread general
 * traffic across buckets. That only dilutes the coarse global limit; the
 * strict auth limits above ignore cookies entirely, so the spray protection
 * cannot be bypassed this way.
 */
export function rateLimitKey(req: KeyableRequest): string {
  if (isStrictAuthRoute(req.url)) return `ip:${req.ip}`;

  const cookie = req.cookies?.accessToken;
  if (!cookie) return `ip:${req.ip}`;

  const tokenHash = createHash('sha256').update(cookie).digest('base64url').slice(0, 16);
  return `ip:${req.ip}:tok:${tokenHash}`;
}

export function rateLimitMax(env: RateLimitEnv, req: KeyableRequest): number {
  return isStrictAuthRoute(req.url) ? env.authMax : env.max;
}

/** 429 body in the same shape as GlobalExceptionFilter, message as a k.* key. */
export function rateLimitErrorResponse(): {
  statusCode: number;
  message: string;
  error: string;
} {
  return {
    statusCode: 429,
    message: k.auth.errors.tooManyRequests,
    error: 'Too Many Requests',
  };
}
