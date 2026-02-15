/**
 * Centralized security configuration.
 * All security-related constants should be defined here to prevent drift.
 */
export const SECURITY_CONFIG = {
  /** Number of bcrypt hashing rounds for password hashing */
  BCRYPT_ROUNDS: 12,

  /** Maximum failed login attempts before lockout */
  LOGIN_MAX_ATTEMPTS: 10,

  /** Lockout duration in seconds (15 minutes) */
  LOGIN_LOCKOUT_SECONDS: 15 * 60,
} as const;
