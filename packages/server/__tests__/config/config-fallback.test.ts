import type { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import { configWithFallback } from '../../src/config/index.js';

const config = (values: Record<string, unknown>) =>
  ({ get: (key: string) => values[key] }) as unknown as ConfigService;

describe('configWithFallback', () => {
  it('prefers the specific name', () => {
    const c = config({ IAM_REDIS_HOST: 'sessions', REDIS_HOST: 'shared' });
    expect(configWithFallback(c, 'IAM_REDIS_HOST', 'REDIS_HOST', 'localhost')).toBe('sessions');
  });

  it('falls back to the shared name — a platform deploy wires only REDIS_*', () => {
    const c = config({ REDIS_HOST: 'specbook-redis-shop', REDIS_PORT: 6380, REDIS_PASSWORD: 'p' });
    expect(configWithFallback(c, 'IAM_REDIS_HOST', 'REDIS_HOST', 'localhost')).toBe(
      'specbook-redis-shop',
    );
    expect(configWithFallback(c, 'IAM_REDIS_PORT', 'REDIS_PORT', 6379)).toBe(6380);
    expect(configWithFallback(c, 'IAM_REDIS_PASSWORD', 'REDIS_PASSWORD')).toBe('p');
  });

  it('then to the default, or undefined without one', () => {
    const c = config({});
    expect(configWithFallback(c, 'IAM_REDIS_HOST', 'REDIS_HOST', 'localhost')).toBe('localhost');
    expect(configWithFallback(c, 'IAM_REDIS_PASSWORD', 'REDIS_PASSWORD')).toBeUndefined();
  });
});
