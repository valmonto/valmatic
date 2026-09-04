import { describe, expect, it } from 'vitest';
import { validateEnv } from '@/config/index.js';

/**
 * WEB_APP_URL builds the copyable links the API hands back (invitation accept
 * links, etc.). A silent dev default in production ships broken
 * http://localhost:5173 links to real users, so it must fail loud there while
 * keeping the localhost default for dev/test.
 */

// A base config that satisfies every OTHER production requirement, so a failure
// isolates to the field under test.
const prodBase = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  IAM_JWT_SECRET: 'x'.repeat(32),
  IAM_COOKIE_SECRET: 'y'.repeat(32),
  SEED_INITIAL_EMAIL: 'owner@example.com',
  SEED_INITIAL_PASSWORD: 'password123',
};

describe('WEB_APP_URL config validation', () => {
  it('fails loud in production when WEB_APP_URL is unset', () => {
    expect(() => validateEnv(prodBase)).toThrow(/WEB_APP_URL is required in production/);
  });

  it('accepts an explicit WEB_APP_URL in production', () => {
    const env = validateEnv({ ...prodBase, WEB_APP_URL: 'https://app.example.com' });
    expect(env.WEB_APP_URL).toBe('https://app.example.com');
  });

  it('retains the localhost default in development when WEB_APP_URL is unset', () => {
    const env = validateEnv({
      NODE_ENV: 'development',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      IAM_JWT_SECRET: 'x'.repeat(32),
      IAM_COOKIE_SECRET: 'y'.repeat(32),
    });
    expect(env.WEB_APP_URL).toBe('http://localhost:5173');
  });

  it('retains the localhost default in test when WEB_APP_URL is unset', () => {
    const env = validateEnv({
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      IAM_JWT_SECRET: 'x'.repeat(32),
      IAM_COOKIE_SECRET: 'y'.repeat(32),
    });
    expect(env.WEB_APP_URL).toBe('http://localhost:5173');
  });
});

const base = () => ({
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  IAM_JWT_SECRET: 'x'.repeat(32),
  IAM_COOKIE_SECRET: 'y'.repeat(32),
});

describe('AUTH_RATE_LIMIT_MAX', () => {
  it('defaults to the production spray limit and coerces an override', () => {
    expect(validateEnv(base()).AUTH_RATE_LIMIT_MAX).toBe(10);
    expect(validateEnv({ ...base(), AUTH_RATE_LIMIT_MAX: '1000' }).AUTH_RATE_LIMIT_MAX).toBe(1000);
  });

  it('rejects a non-positive override', () => {
    expect(() => validateEnv({ ...base(), AUTH_RATE_LIMIT_MAX: '0' })).toThrow();
  });
});
