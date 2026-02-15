import { type ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import type { ActiveUser } from '@pkg/contracts';
import { k } from '@pkg/locales';
import { IS_PUBLIC_KEY } from '../decorators/public-route.decorator';
import { AUTH_PROVIDER, type IAuthProvider } from '../auth-provider';
import { COOKIE_OPTIONS, COOKIE_TTL } from '../../../../config';
import type { FastifyReply, FastifyRequest } from 'fastify';
import '@fastify/cookie';

interface CookieRequest {
  cookies?: Record<string, string | undefined>;
  unsignCookie: (cookie: string) => { valid: boolean; value: string | null };
  headers?: { authorization?: string };
}

/**
 * Extracts access token from signed cookie or Authorization header.
 */
export function extractAccessToken(req: CookieRequest): string | null {
  // Try signed cookie first
  const signedCookie = req.cookies?.accessToken;
  if (signedCookie) {
    const unsigned = req.unsignCookie(signedCookie);
    if (unsigned.valid && unsigned.value) {
      return unsigned.value;
    }
  }

  // Fallback to Authorization header
  const authHeader = req.headers?.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return null;
}

/**
 * Extracts refresh token from signed cookie.
 */
export function extractRefreshToken(req: CookieRequest): string | null {
  const signedCookie = req.cookies?.refreshToken;
  if (signedCookie) {
    const unsigned = req.unsignCookie(signedCookie);
    if (unsigned.valid && unsigned.value) {
      return unsigned.value;
    }
  }
  return null;
}

@Injectable()
export class LocalAuthGuard {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    @Inject(AUTH_PROVIDER) private authProvider: IAuthProvider,
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublicRoute = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublicRoute) {
      return true;
    }

    const req = context.switchToHttp().getRequest<FastifyRequest & { user?: ActiveUser }>();
    const res = context.switchToHttp().getResponse<FastifyReply>();
    const accessToken = extractAccessToken(req);

    // No access token - try to refresh using refresh token
    if (!accessToken) {
      return this.tryRefresh(req, res);
    }

    let payload: { sub: string; orgId: string; role: string; iat: number };
    try {
      payload = await this.jwtService.verifyAsync(accessToken);
    } catch (err) {
      // If token is expired or invalid, try to refresh
      if (err instanceof TokenExpiredError) {
        return this.tryRefresh(req, res);
      }
      throw new UnauthorizedException(k.auth.errors.invalidToken);
    }

    // Check if this token was blacklisted (e.g. after logout)
    if (await this.authProvider.isAccessTokenBlacklisted(accessToken)) {
      throw new UnauthorizedException(k.auth.errors.tokenRevoked);
    }

    // Check if user logged out all devices after this token was issued
    const wasLoggedOut = await this.authProvider.isTokenIssuedBeforeLogoutAll(
      payload.sub,
      payload.iat,
    );
    if (wasLoggedOut) {
      throw new UnauthorizedException(k.auth.errors.sessionInvalidated);
    }

    req.user = {
      userId: payload.sub,
      orgId: payload.orgId,
      role: payload.role,
    };
    return true;
  }

  private async tryRefresh(
    req: FastifyRequest & { user?: ActiveUser },
    res: FastifyReply,
  ): Promise<boolean> {
    const refreshToken = extractRefreshToken(req);
    if (!refreshToken) {
      throw new UnauthorizedException(k.auth.errors.sessionExpired);
    }

    try {
      const tokens = await this.authProvider.refresh({ refreshToken });

      res.setCookie('accessToken', tokens.accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: COOKIE_TTL.ACCESS_TOKEN,
      });

      res.setCookie('refreshToken', tokens.refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: COOKIE_TTL.REFRESH_TOKEN,
      });

      // Verify the new token and set user
      const payload = await this.jwtService.verifyAsync(tokens.accessToken);
      req.user = {
        userId: payload.sub,
        orgId: payload.orgId,
        role: payload.role,
      };

      return true;
    } catch {
      throw new UnauthorizedException(k.auth.errors.sessionExpiredPleaseLogin);
    }
  }
}
