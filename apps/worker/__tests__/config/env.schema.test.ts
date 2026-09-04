import { describe, expect, it } from 'vitest';
import { validateEnv } from '@/config/env.schema.js';

const required = { DATABASE_URL: 'postgresql://user:pass@localhost:5432/db' };

describe('validateEnv', () => {
  it('applies defaults for everything optional', () => {
    const env = validateEnv({ ...required });

    expect(env.NODE_ENV).toBe('development');
    expect(env.REDIS_HOST).toBe('localhost');
    expect(env.REDIS_PORT).toBe(6379);
    expect(env.WORKER_PORT).toBe(3001);
  });

  it('coerces numeric env vars, which always arrive as strings', () => {
    const env = validateEnv({ ...required, REDIS_PORT: '6380', DATABASE_MAX_CONNECTIONS: '20' });

    expect(env.REDIS_PORT).toBe(6380);
    expect(env.DATABASE_MAX_CONNECTIONS).toBe(20);
  });

  it('turns the LOG_FRAMEWORK string into a boolean', () => {
    expect(validateEnv({ ...required, LOG_FRAMEWORK: 'true' }).LOG_FRAMEWORK).toBe(true);
    expect(validateEnv({ ...required, LOG_FRAMEWORK: 'false' }).LOG_FRAMEWORK).toBe(false);
  });

  it('rejects a missing DATABASE_URL', () => {
    expect(() => validateEnv({})).toThrow(/DATABASE_URL/);
  });

  it('rejects a DATABASE_URL that is not a postgres connection string', () => {
    expect(() => validateEnv({ DATABASE_URL: 'not-a-url' })).toThrow(/DATABASE_URL/);
    // `.url()` alone accepted this: a scheme with no host is still a valid URL.
    expect(() => validateEnv({ DATABASE_URL: 'A:' })).toThrow(/DATABASE_URL/);
    expect(() => validateEnv({ DATABASE_URL: 'mysql://user:pass@host:3306/db' })).toThrow(
      /DATABASE_URL/,
    );
  });

  it('rejects an out-of-range port instead of silently clamping it', () => {
    expect(() => validateEnv({ ...required, REDIS_PORT: '99999' })).toThrow(/REDIS_PORT/);
  });
});
