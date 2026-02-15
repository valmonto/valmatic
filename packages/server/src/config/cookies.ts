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
 * Cookie TTL values in seconds.
 * Should match the corresponding token TTL values.
 */
export const COOKIE_TTL = {
  /** Access token TTL: 15 minutes (must match JWT ACCESS_TOKEN_TTL) */
  ACCESS_TOKEN: 15 * 60,

  /** Refresh token TTL: 24 hours (must match Redis MAX_SESSION_TTL) */
  REFRESH_TOKEN: 24 * 60 * 60,
} as const;
