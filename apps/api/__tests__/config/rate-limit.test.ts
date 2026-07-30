import { describe, expect, it } from 'vitest';
import { isStrictAuthRoute, rateLimitKey, rateLimitMax } from '@/config/rate-limit';

const env = { max: 300, authMax: 10, windowMs: 60_000 };

describe('rate limit policy', () => {
  it('limits login and register strictly, everything else generously', () => {
    expect(rateLimitMax(env, { ip: '1.2.3.4', url: '/api/auth/login' })).toBe(10);
    expect(rateLimitMax(env, { ip: '1.2.3.4', url: '/api/auth/register' })).toBe(10);
    expect(rateLimitMax(env, { ip: '1.2.3.4', url: '/api/users' })).toBe(300);
  });

  it('matches strict routes by path, not by substring', () => {
    expect(isStrictAuthRoute('/api/auth/login?x=1')).toBe(true);
    expect(isStrictAuthRoute('/api/auth/logout')).toBe(false);
    expect(isStrictAuthRoute('/api/users/auth/login')).toBe(false);
  });

  /**
   * Auth buckets are IP-only ON PURPOSE: anything else in the key would let an
   * attacker mint fresh buckets and bypass the spray limit.
   */
  it('keys auth routes by IP alone, whatever cookies are sent', () => {
    const withCookie = rateLimitKey({
      ip: '1.2.3.4',
      url: '/api/auth/login',
      cookies: { accessToken: 'anything' },
    });

    expect(withCookie).toBe('ip:1.2.3.4');
  });

  // Carrier NAT: thousands of users share one IP. The session cookie in the
  // key gives each their own bucket instead of exhausting each other's.
  it('separates authenticated users sharing one IP', () => {
    const a = rateLimitKey({ ip: '1.2.3.4', url: '/api/users', cookies: { accessToken: 'aaa' } });
    const b = rateLimitKey({ ip: '1.2.3.4', url: '/api/users', cookies: { accessToken: 'bbb' } });

    expect(a).not.toBe(b);
    expect(a.startsWith('ip:1.2.3.4:tok:')).toBe(true);
  });

  it('falls back to the IP when there is no session', () => {
    expect(rateLimitKey({ ip: '1.2.3.4', url: '/api/users' })).toBe('ip:1.2.3.4');
  });

  // Mobile has no cookie — it sends Authorization: Bearer. Without this,
  // every mobile user behind one carrier IP shares a single bucket, which is
  // the exact failure the session keying exists to prevent.
  it('separates mobile users (Authorization header, no cookie) sharing one IP', () => {
    const a = rateLimitKey({ ip: '1.2.3.4', url: '/api/users', authorizationHeader: 'Bearer aaa' });
    const b = rateLimitKey({ ip: '1.2.3.4', url: '/api/users', authorizationHeader: 'Bearer bbb' });

    expect(a).not.toBe(b);
    expect(a.startsWith('ip:1.2.3.4:tok:')).toBe(true);
  });

  it('keys auth routes by IP alone for header clients too', () => {
    const key = rateLimitKey({
      ip: '1.2.3.4',
      url: '/api/auth/login',
      authorizationHeader: 'Bearer anything',
    });

    expect(key).toBe('ip:1.2.3.4');
  });

  it('does not put the raw token into the key', () => {
    const key = rateLimitKey({
      ip: '1.2.3.4',
      url: '/api/users',
      cookies: { accessToken: 'super-secret-token' },
    });

    expect(key).not.toContain('super-secret-token');
  });
});
