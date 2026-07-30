/**
 * Centralized cookie configuration.
 * All cookie-related constants should be defined here to prevent drift.
 */

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Base cookie options for auth tokens.
 * Used for accessToken and refreshToken cookies.
 */
export const COOKIE_OPTIONS = {
  signed: true,
  httpOnly: true,
  path: '/',
  sameSite: 'lax' as const,
  secure: isProduction,
} as const;

/**
 * Cookie TTL values in seconds — read from the SAME env vars the token layer
 * uses, so they cannot drift. These used to be hardcoded "must match" comments,
 * and raising IAM_MAX_SESSION_TTL without touching this file silently kept
 * logging web users out at the old 24h: the browser deleted the refresh cookie
 * while the Redis session lived on.
 */
const envSeconds = (name: string, fallback: number): number => {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw > 0 ? raw : fallback;
};

export const COOKIE_TTL = {
  /** Follows IAM_ACCESS_TOKEN_TTL (default 15 minutes). */
  ACCESS_TOKEN: envSeconds('IAM_ACCESS_TOKEN_TTL', 15 * 60),

  /** Follows IAM_MAX_SESSION_TTL (default 30 days). */
  REFRESH_TOKEN: envSeconds('IAM_MAX_SESSION_TTL', 30 * 24 * 60 * 60),
} as const;
