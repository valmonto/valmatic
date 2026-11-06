import { type ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import type { ActiveUser } from '@pkg/contracts';
import { k } from '@pkg/locales';
import { IS_PUBLIC_KEY } from '../decorators/public-route.decorator.js';
import { AUTH_PROVIDER, type IAuthProvider } from '../auth-provider.js';
import type { HttpRequest, HttpResponse } from '../../../../common/http/index.js';
import { AuthCookies } from './auth-cookies.js';

type GuardedRequest = HttpRequest & { user?: ActiveUser };

@Injectable()
export class LocalAuthGuard {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    @Inject(AUTH_PROVIDER) private authProvider: IAuthProvider,
    private cookies: AuthCookies,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublicRoute = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublicRoute) {
      return true;
    }

    const req = context.switchToHttp().getRequest<GuardedRequest>();
    const res = context.switchToHttp().getResponse<HttpResponse>();
    const accessToken = this.cookies.accessToken(req);

    // No access token - try to refresh using refresh token
    if (!accessToken) {
      return this.tryRefresh(req, res);
    }

    let payload: {
      sub: string;
      orgId: string;
      orgRole: ActiveUser['orgRole'];
      systemRole: ActiveUser['systemRole'];
      iat: number;
      /** Tokens made before milliseconds were added carry only `iat`. */
      iatMs?: number;
    };
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
      payload.iatMs ?? (payload.iat == null ? payload.iat : payload.iat * 1000),
    );
    if (wasLoggedOut) {
      throw new UnauthorizedException(k.auth.errors.sessionInvalidated);
    }

    req.user = {
      userId: payload.sub,
      orgId: payload.orgId,
      orgRole: payload.orgRole,
      systemRole: payload.systemRole,
    };
    return true;
  }

  private async tryRefresh(req: GuardedRequest, res: HttpResponse): Promise<boolean> {
    const refreshToken = this.cookies.refreshToken(req);
    if (!refreshToken) {
      throw new UnauthorizedException(k.auth.errors.sessionExpired);
    }

    try {
      const tokens = await this.authProvider.refresh({ refreshToken });

      this.cookies.set(res, tokens);

      // Verify the new token and set user
      const payload = await this.jwtService.verifyAsync(tokens.accessToken);
      req.user = {
        userId: payload.sub,
        orgId: payload.orgId,
        orgRole: payload.orgRole,
        systemRole: payload.systemRole,
      };

      return true;
    } catch {
      throw new UnauthorizedException(k.auth.errors.sessionExpiredPleaseLogin);
    }
  }
}
