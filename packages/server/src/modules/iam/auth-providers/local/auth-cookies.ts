import { createHmac, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost } from '@nestjs/core';
import { COOKIE_OPTIONS, COOKIE_TTL } from '../../../../config/index.js';
import type { HttpRequest, HttpResponse } from '../../../../common/http/index.js';

export interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * One cookie from a `Cookie` header, percent-decoded; undefined when it was
 * not sent. The first occurrence of a name wins, as with Nest's `@Cookies()`.
 */
export function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1 || part.slice(0, eq).trim() !== name) continue;
    let value = part.slice(eq + 1).trim();
    if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
  return undefined;
}

const digest = (value: string, secret: string): string =>
  createHmac('sha256', secret).update(value).digest('base64').replace(/=+$/, '');

/**
 * Signs a cookie value the way Nest's `setCookie(..., { signed: true })`
 * does — `s:<value>.<base64 HMAC-SHA256, no padding>`, the `cookie-signature`
 * format — so Nest's `@SignedCookies()` reads these too.
 */
export function signCookie(value: string, secret: string): string {
  return `s:${value}.${digest(value, secret)}`;
}

/**
 * The value of a signed cookie when its signature verifies, else undefined.
 * The `s:` is optional: `@fastify/cookie` signed the same way without it, so
 * sessions signed before the switch keep working. (Nest verifies signed
 * cookies only for the `@SignedCookies()` parameter decorator; a guard has no
 * parameters, hence this.)
 */
export function unsignCookie(input: string, secret: string): string | undefined {
  const signed = input.startsWith('s:') ? input.slice(2) : input;
  const dot = signed.lastIndexOf('.');
  if (dot <= 0) return undefined;
  const value = signed.slice(0, dot);
  const expected = Buffer.from(digest(value, secret));
  const given = Buffer.from(signed.slice(dot + 1));
  return given.length === expected.length && timingSafeEqual(given, expected) ? value : undefined;
}

/**
 * The web session's two httpOnly cookies, in one place: set, cleared and read
 * the same way by the auth guard and every controller that signs someone in
 * or out. Writes go through the HTTP adapter (`setCookie` / `clearCookie`),
 * so nothing here depends on which adapter runs.
 *
 * Signed here with IAM_COOKIE_SECRET from ConfigService rather than through
 * Nest's `cookies.secret` app option: that option is read before ConfigModule
 * has loaded `.env`, so in dev it would be empty and every login would 500.
 */
@Injectable()
export class AuthCookies {
  constructor(
    private readonly adapterHost: HttpAdapterHost,
    private readonly config: ConfigService,
  ) {}

  set(res: HttpResponse, tokens: AuthTokenPair): void {
    const http = this.adapterHost.httpAdapter;
    http.setCookie(res, 'accessToken', signCookie(tokens.accessToken, this.secret()), {
      ...COOKIE_OPTIONS,
      maxAge: COOKIE_TTL.ACCESS_TOKEN,
    });
    http.setCookie(res, 'refreshToken', signCookie(tokens.refreshToken, this.secret()), {
      ...COOKIE_OPTIONS,
      maxAge: COOKIE_TTL.REFRESH_TOKEN,
    });
  }

  clear(res: HttpResponse): void {
    const http = this.adapterHost.httpAdapter;
    http.clearCookie(res, 'accessToken', { path: '/' });
    http.clearCookie(res, 'refreshToken', { path: '/' });
  }

  /** The access token: the signed cookie (web), else a Bearer header (mobile, API). */
  accessToken(req: Pick<HttpRequest, 'headers'>): string | null {
    const fromCookie = this.signed(req, 'accessToken');
    if (fromCookie) return fromCookie;
    const header = req.headers.authorization;
    return header?.startsWith('Bearer ') ? header.slice(7) : null;
  }

  /** The refresh token from its signed cookie (web only; mobile sends it in the body). */
  refreshToken(req: Pick<HttpRequest, 'headers'>): string | null {
    return this.signed(req, 'refreshToken');
  }

  private signed(req: Pick<HttpRequest, 'headers'>, name: string): string | null {
    const raw = readCookie(req.headers.cookie, name);
    if (!raw) return null;
    return unsignCookie(raw, this.secret()) || null;
  }

  private secret(): string {
    return this.config.getOrThrow<string>('IAM_COOKIE_SECRET');
  }
}
