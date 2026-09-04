import type { ThrottlerStorage } from '@nestjs/throttler';
import type { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface.js';
import type { Redis } from 'ioredis';

/**
 * Redis-backed counters for @nestjs/throttler — in-memory counters would
 * multiply every limit by the replica count and reset on restart, exactly
 * when an attacker retries.
 *
 * Fixed window per key: INCR, first hit sets the TTL. blockDuration is not
 * supported (a blocked key simply stays limited until its window expires) —
 * declare limits with ttl only.
 */
export class ThrottlerRedisStorage implements ThrottlerStorage {
  constructor(private readonly redis: Redis) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    _blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const fullKey = `throttle:${throttlerName}:${key}`;

    const totalHits = await this.redis.incr(fullKey);
    if (totalHits === 1) {
      await this.redis.pexpire(fullKey, ttl);
    }

    let timeToExpire = await this.redis.pttl(fullKey);
    if (timeToExpire < 0) {
      // The INCR raced a expiry or the PEXPIRE was lost — never leave a
      // counter that lives forever.
      await this.redis.pexpire(fullKey, ttl);
      timeToExpire = ttl;
    }

    const isBlocked = totalHits > limit;

    return {
      totalHits,
      timeToExpire,
      isBlocked,
      timeToBlockExpire: isBlocked ? timeToExpire : 0,
    };
  }
}
