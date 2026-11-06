import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import type { HttpAdapterHost } from '@nestjs/core';
import type { ConfigService } from '@nestjs/config';
import {
  AuthCookies,
  readCookie,
  signCookie,
  unsignCookie,
} from '../../../../../src/modules/iam/auth-providers/local/auth-cookies.js';

const SECRET = 'cookie-secret-at-least-32-characters-long';
const JWT = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1In0.c2lnbmF0dXJl';

/** How @fastify/cookie signed before the switch: no `s:` prefix. */
const fastifySigned = (value: string) =>
  `${value}.${createHmac('sha256', SECRET).update(value).digest('base64').replace(/=+$/, '')}`;

function cookies() {
  const setCookie = vi.fn();
  const clearCookie = vi.fn();
  const auth = new AuthCookies(
    { httpAdapter: { setCookie, clearCookie } } as unknown as HttpAdapterHost,
    { getOrThrow: () => SECRET } as unknown as ConfigService,
  );
  return { auth, setCookie, clearCookie };
}

describe('readCookie', () => {
  it('finds one cookie by exact name, percent-decoded; the first occurrence wins', () => {
    const header = 'theme=dark; accessToken=s%3Aa.b; xaccessToken=no; accessToken=second';
    expect(readCookie(header, 'accessToken')).toBe('s:a.b');
    expect(readCookie(header, 'theme')).toBe('dark');
    expect(readCookie(header, 'missing')).toBeUndefined();
    expect(readCookie(undefined, 'theme')).toBeUndefined();
    expect(readCookie('q="quoted"', 'q')).toBe('quoted');
    expect(readCookie('bad=%E0%A4%A', 'bad')).toBe('%E0%A4%A');
  });
});

describe('signCookie / unsignCookie', () => {
  it('round-trips a JWT (dots in the value) in the s:value.signature format', () => {
    const signed = signCookie(JWT, SECRET);
    expect(signed.startsWith(`s:${JWT}.`)).toBe(true);
    expect(unsignCookie(signed, SECRET)).toBe(JWT);
  });

  it('still verifies values @fastify/cookie signed (no s: prefix)', () => {
    expect(unsignCookie(fastifySigned(JWT), SECRET)).toBe(JWT);
  });

  it('refuses another secret, a tampered value and an unsigned value', () => {
    expect(unsignCookie(signCookie(JWT, 'other-secret'), SECRET)).toBeUndefined();
    expect(
      unsignCookie(signCookie(JWT, SECRET).replace('eyJzdWIiOiJ1In0', 'eyJzdWIiOiJ2In0'), SECRET),
    ).toBeUndefined();
    expect(unsignCookie(JWT, SECRET)).toBeUndefined();
    expect(unsignCookie('nodot', SECRET)).toBeUndefined();
  });
});

describe('AuthCookies', () => {
  it('sets both cookies signed, httpOnly, with the TTLs in seconds', () => {
    const { auth, setCookie } = cookies();
    const res = {};
    auth.set(res, { accessToken: 'a', refreshToken: 'r' });
    expect(setCookie).toHaveBeenCalledTimes(2);
    const [access, refresh] = setCookie.mock.calls;
    expect(access![0]).toBe(res);
    expect(access!.slice(1, 3)).toEqual(['accessToken', signCookie('a', SECRET)]);
    expect(access![3]).toMatchObject({ httpOnly: true, path: '/', sameSite: 'lax', maxAge: 900 });
    expect(refresh!.slice(1, 3)).toEqual(['refreshToken', signCookie('r', SECRET)]);
    expect(refresh![3]).toMatchObject({ maxAge: 30 * 24 * 60 * 60 });
  });

  it('clears both on path /', () => {
    const { auth, clearCookie } = cookies();
    auth.clear({});
    expect(clearCookie.mock.calls.map((c) => [c[1], c[2]])).toEqual([
      ['accessToken', { path: '/' }],
      ['refreshToken', { path: '/' }],
    ]);
  });

  it('reads the access token from the signed cookie first, then a Bearer header', () => {
    const { auth } = cookies();
    const cookie = `accessToken=${encodeURIComponent(signCookie('from-cookie', SECRET))}`;
    expect(auth.accessToken({ headers: { cookie, authorization: 'Bearer from-header' } })).toBe(
      'from-cookie',
    );
    expect(
      auth.accessToken({ headers: { cookie: 'accessToken=forged', authorization: 'Bearer h' } }),
    ).toBe('h');
    expect(auth.accessToken({ headers: { authorization: 'Basic x' } })).toBeNull();
    expect(auth.accessToken({ headers: {} })).toBeNull();
  });

  it('reads the refresh token only from its signed cookie', () => {
    const { auth } = cookies();
    const cookie = `refreshToken=${fastifySigned('old-session')}`;
    expect(auth.refreshToken({ headers: { cookie } })).toBe('old-session');
    expect(auth.refreshToken({ headers: { authorization: 'Bearer x' } })).toBeNull();
  });
});
