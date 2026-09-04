import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HealthService } from '../../../src/modules/health/health.service.js';

type Db = { sql: ReturnType<typeof vi.fn> };
type Cache = { ping: ReturnType<typeof vi.fn> };

const okDb = (): Db => ({ sql: vi.fn().mockResolvedValue([{ '?column?': 1 }]) });
const okRedis = (): Cache => ({ ping: vi.fn().mockResolvedValue('PONG') });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const build = (db?: unknown, redis?: unknown) => new HealthService(db as any, redis as any);

describe('HealthService', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('serves build identity alongside status and uptime', async () => {
    const sha = 'a'.repeat(40);
    vi.stubEnv('GIT_SHA', sha);
    vi.stubEnv('BUILT_AT', '2026-09-03T18:50:40Z');

    const report = await build(okDb(), okRedis()).check();

    expect(report).toMatchObject({
      status: 'ok',
      sha,
      shortSha: 'aaaaaaa',
      builtAt: '2026-09-03T18:50:40.000Z',
    });
  });

  it('reports sha: null rather than a fabricated value when GIT_SHA is unset', async () => {
    vi.stubEnv('GIT_SHA', '');
    vi.stubEnv('BUILT_AT', '');

    const report = await build(okDb(), okRedis()).check();

    expect(report.sha).toBeNull();
    expect(report.shortSha).toBeNull();
    expect(report.builtAt).toBeNull();
  });

  it('reports ok when both dependencies respond', async () => {
    const report = await build(okDb(), okRedis()).check();

    expect(report.status).toBe('ok');
    expect(report.uptime).toBeGreaterThanOrEqual(0);
  });

  it('reports degraded when the database is unreachable', async () => {
    const db: Db = { sql: vi.fn().mockRejectedValue(new Error('ECONNREFUSED')) };

    expect((await build(db, okRedis()).check()).status).toBe('degraded');
  });

  it('reports degraded when redis is unreachable', async () => {
    const redis: Cache = { ping: vi.fn().mockRejectedValue(new Error('ECONNREFUSED')) };

    expect((await build(okDb(), redis).check()).status).toBe('degraded');
  });

  it('still reports ok when no dependencies are wired in (e.g. the worker)', async () => {
    expect((await build(undefined, undefined).check()).status).toBe('ok');
  });

  it('caches the probe so repeated calls cannot generate load', async () => {
    const db = okDb();
    const redis = okRedis();
    const service = build(db, redis);

    await Promise.all([service.check(), service.check(), service.check()]);
    await service.check();

    expect(db.sql).toHaveBeenCalledTimes(1);
    expect(redis.ping).toHaveBeenCalledTimes(1);
  });

  it('treats a hanging probe as a failure rather than hanging the response', async () => {
    // postgres.js connects lazily, so an unreachable host stalls instead of throwing.
    const db: Db = { sql: vi.fn().mockReturnValue(new Promise(() => {})) };
    const service = build(db, okRedis());

    vi.useFakeTimers();
    const pending = service.check();
    await vi.advanceTimersByTimeAsync(2_100);

    expect((await pending).status).toBe('degraded');
  });
});
