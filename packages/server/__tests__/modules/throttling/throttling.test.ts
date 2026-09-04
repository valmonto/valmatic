import type { Redis } from 'ioredis';
import { describe, expect, it, vi } from 'vitest';
import { throttlerTracker } from '../../../src/modules/throttling/throttler.guard.js';
import { ThrottlerRedisStorage } from '../../../src/modules/throttling/throttler.storage.js';

describe('throttlerTracker', () => {
  const user = {
    userId: '11111111-1111-4111-8111-111111111111',
    orgId: '22222222-2222-4222-8222-222222222222',
    orgRole: 'MEMBER' as const,
    systemRole: 'USER' as const,
  };

  // Carrier NAT: thousands of users share one IP. The verified userId gives
  // each their own budget regardless of network — and it works identically
  // for cookie (web) and bearer (mobile) clients, because it comes from the
  // session the auth chain already verified, not from the raw request.
  it('keys authenticated requests by the verified user, not the IP', () => {
    expect(throttlerTracker({ ip: '1.2.3.4', user })).toBe(`user:${user.userId}`);
    expect(throttlerTracker({ ip: '9.9.9.9', user })).toBe(`user:${user.userId}`);
  });

  // Public routes (login, register): no user exists yet, and nothing the
  // client controls may enter the key — or an attacker could mint fresh
  // buckets and walk past the spray limit.
  it('keys unauthenticated requests by IP alone', () => {
    expect(throttlerTracker({ ip: '1.2.3.4' })).toBe('ip:1.2.3.4');
  });

  it('separates users sharing one IP', () => {
    const other = { ...user, userId: '33333333-3333-4333-8333-333333333333' };

    expect(throttlerTracker({ ip: '1.2.3.4', user })).not.toBe(
      throttlerTracker({ ip: '1.2.3.4', user: other }),
    );
  });
});

describe('ThrottlerRedisStorage', () => {
  function redisWith(overrides: Partial<Record<'incr' | 'pexpire' | 'pttl', unknown>>): Redis {
    return {
      incr: vi.fn().mockResolvedValue(1),
      pexpire: vi.fn().mockResolvedValue(1),
      pttl: vi.fn().mockResolvedValue(60_000),
      ...overrides,
    } as unknown as Redis;
  }

  it('starts the window on the first hit', async () => {
    const redis = redisWith({});
    const storage = new ThrottlerRedisStorage(redis);

    const record = await storage.increment('user:u1', 60_000, 300, 0, 'default');

    expect(redis.pexpire).toHaveBeenCalledWith('throttle:default:user:u1', 60_000);
    expect(record).toMatchObject({ totalHits: 1, isBlocked: false });
  });

  it('blocks past the limit and reports when the window ends', async () => {
    const redis = redisWith({ incr: vi.fn().mockResolvedValue(301), pttl: vi.fn().mockResolvedValue(42_000) });
    const storage = new ThrottlerRedisStorage(redis);

    const record = await storage.increment('user:u1', 60_000, 300, 0, 'default');

    expect(record).toMatchObject({ totalHits: 301, isBlocked: true, timeToBlockExpire: 42_000 });
  });

  // A counter without a TTL throttles forever. PTTL returning -1 means the
  // expiry was lost (a race, a failover) — re-arm it rather than trusting it.
  it('never leaves a counter that lives forever', async () => {
    const redis = redisWith({ incr: vi.fn().mockResolvedValue(5), pttl: vi.fn().mockResolvedValue(-1) });
    const storage = new ThrottlerRedisStorage(redis);

    const record = await storage.increment('user:u1', 60_000, 300, 0, 'default');

    expect(redis.pexpire).toHaveBeenCalledWith('throttle:default:user:u1', 60_000);
    expect(record.timeToExpire).toBe(60_000);
  });

  it('separates throttler names into separate buckets', async () => {
    const redis = redisWith({});
    const storage = new ThrottlerRedisStorage(redis);

    await storage.increment('user:u1', 60_000, 300, 0, 'default');
    await storage.increment('user:u1', 60_000, 10, 0, 'strict');

    expect(redis.incr).toHaveBeenCalledWith('throttle:default:user:u1');
    expect(redis.incr).toHaveBeenCalledWith('throttle:strict:user:u1');
  });
});
