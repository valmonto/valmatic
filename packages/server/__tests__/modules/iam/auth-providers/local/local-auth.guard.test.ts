import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import type { HttpAdapterHost, Reflector } from '@nestjs/core';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import { TokenExpiredError } from '@nestjs/jwt';
import { LocalAuthGuard } from '../../../../../src/modules/iam/auth-providers/local/local-auth.guard.js';
import {
  AuthCookies,
  signCookie,
} from '../../../../../src/modules/iam/auth-providers/local/auth-cookies.js';
import type { IAuthProvider } from '../../../../../src/modules/iam/auth-providers/auth-provider.js';

const SECRET = 'cookie-secret-at-least-32-characters-long';

describe('LocalAuthGuard', () => {
  let guard: LocalAuthGuard;
  let mockReflector: Reflector;
  let mockJwtService: JwtService;
  let mockAuthProvider: IAuthProvider;
  let setCookie: ReturnType<typeof vi.fn>;

  const createMockContext = (
    options: {
      cookie?: string;
      authHeader?: string;
      user?: unknown;
    } = {},
  ): ExecutionContext => {
    const request = {
      headers: {
        ...(options.authHeader ? { authorization: options.authHeader } : {}),
        ...(options.cookie ? { cookie: options.cookie } : {}),
      },
      user: options.user,
    };
    const response = {};

    return {
      getHandler: () => () => {},
      getClass: () => class {},
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    mockReflector = {
      getAllAndOverride: vi.fn(),
    } as unknown as Reflector;

    mockJwtService = {
      verifyAsync: vi.fn(),
    } as unknown as JwtService;

    mockAuthProvider = {
      isAccessTokenBlacklisted: vi.fn(),
      isTokenIssuedBeforeLogoutAll: vi.fn(),
      refresh: vi.fn(),
    } as unknown as IAuthProvider;

    setCookie = vi.fn();
    const cookies = new AuthCookies(
      { httpAdapter: { setCookie, clearCookie: vi.fn() } } as unknown as HttpAdapterHost,
      { getOrThrow: () => SECRET } as unknown as ConfigService,
    );
    guard = new LocalAuthGuard(mockReflector, mockJwtService, mockAuthProvider, cookies);
  });

  describe('canActivate', () => {
    it('should allow public routes without authentication', async () => {
      const context = createMockContext();
      vi.mocked(mockReflector.getAllAndOverride).mockReturnValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockJwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('should authenticate valid token and set user on request', async () => {
      const context = createMockContext({
        authHeader: 'Bearer valid-token',
      });
      vi.mocked(mockReflector.getAllAndOverride).mockReturnValue(false);
      vi.mocked(mockJwtService.verifyAsync).mockResolvedValue({
        sub: 'user-123',
        orgId: 'org-456',
        orgRole: 'ADMIN',
        systemRole: 'USER',
        iat: 1234567890,
      });
      vi.mocked(mockAuthProvider.isAccessTokenBlacklisted).mockResolvedValue(false);
      vi.mocked(mockAuthProvider.isTokenIssuedBeforeLogoutAll).mockResolvedValue(false);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      const req = context.switchToHttp().getRequest();
      expect(req.user).toEqual({
        userId: 'user-123',
        orgId: 'org-456',
        orgRole: 'ADMIN',
        systemRole: 'USER',
      });
    });

    it('checks the logout cut-off in milliseconds, from iatMs or else iat', async () => {
      vi.mocked(mockReflector.getAllAndOverride).mockReturnValue(false);
      vi.mocked(mockAuthProvider.isAccessTokenBlacklisted).mockResolvedValue(false);
      vi.mocked(mockAuthProvider.isTokenIssuedBeforeLogoutAll).mockResolvedValue(false);
      const claims = { sub: 'user-123', orgId: 'org-456', orgRole: 'ADMIN', systemRole: 'USER' };

      vi.mocked(mockJwtService.verifyAsync).mockResolvedValue({
        ...claims,
        iat: 1792519507,
        iatMs: 1792519507372,
      });
      await guard.canActivate(createMockContext({ authHeader: 'Bearer new-token' }));
      expect(mockAuthProvider.isTokenIssuedBeforeLogoutAll).toHaveBeenLastCalledWith(
        'user-123',
        1792519507372,
      );

      vi.mocked(mockJwtService.verifyAsync).mockResolvedValue({ ...claims, iat: 1792519507 });
      await guard.canActivate(createMockContext({ authHeader: 'Bearer old-token' }));
      expect(mockAuthProvider.isTokenIssuedBeforeLogoutAll).toHaveBeenLastCalledWith(
        'user-123',
        1792519507000,
      );
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      const context = createMockContext({
        authHeader: 'Bearer invalid-token',
      });
      vi.mocked(mockReflector.getAllAndOverride).mockReturnValue(false);
      vi.mocked(mockJwtService.verifyAsync).mockRejectedValue(new Error('Invalid'));

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(context)).rejects.toThrow('auth.errors.invalidToken');
    });

    it('should throw UnauthorizedException for blacklisted token', async () => {
      const context = createMockContext({
        authHeader: 'Bearer blacklisted-token',
      });
      vi.mocked(mockReflector.getAllAndOverride).mockReturnValue(false);
      vi.mocked(mockJwtService.verifyAsync).mockResolvedValue({
        sub: 'user-123',
        orgId: 'org-456',
        orgRole: 'ADMIN',
        systemRole: 'USER',
        iat: 1234567890,
      });
      vi.mocked(mockAuthProvider.isAccessTokenBlacklisted).mockResolvedValue(true);

      await expect(guard.canActivate(context)).rejects.toThrow('auth.errors.tokenRevoked');
    });

    it('should throw UnauthorizedException when session was invalidated', async () => {
      const context = createMockContext({
        authHeader: 'Bearer old-token',
      });
      vi.mocked(mockReflector.getAllAndOverride).mockReturnValue(false);
      vi.mocked(mockJwtService.verifyAsync).mockResolvedValue({
        sub: 'user-123',
        orgId: 'org-456',
        orgRole: 'ADMIN',
        systemRole: 'USER',
        iat: 1234567890,
      });
      vi.mocked(mockAuthProvider.isAccessTokenBlacklisted).mockResolvedValue(false);
      vi.mocked(mockAuthProvider.isTokenIssuedBeforeLogoutAll).mockResolvedValue(true);

      await expect(guard.canActivate(context)).rejects.toThrow('auth.errors.sessionInvalidated');
    });

    it('should try refresh when token is expired', async () => {
      const context = createMockContext({
        authHeader: 'Bearer expired-token',
        cookie: `refreshToken=${encodeURIComponent(signCookie('refresh-token', SECRET))}`,
      });
      vi.mocked(mockReflector.getAllAndOverride).mockReturnValue(false);
      vi.mocked(mockJwtService.verifyAsync)
        .mockRejectedValueOnce(new TokenExpiredError('expired', new Date()))
        .mockResolvedValueOnce({
          sub: 'user-123',
          orgId: 'org-456',
          role: 'ADMIN',
        });
      vi.mocked(mockAuthProvider.refresh).mockResolvedValue({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockAuthProvider.refresh).toHaveBeenCalledWith({ refreshToken: 'refresh-token' });
      // The new pair goes back as cookies, signed.
      expect(setCookie.mock.calls.map((c) => [c[1], c[2]])).toEqual([
        ['accessToken', signCookie('new-access', SECRET)],
        ['refreshToken', signCookie('new-refresh', SECRET)],
      ]);
    });

    it('a refresh cookie with a bad signature is no refresh token', async () => {
      const context = createMockContext({
        cookie: `refreshToken=${encodeURIComponent(signCookie('refresh-token', 'another-secret'))}`,
      });
      vi.mocked(mockReflector.getAllAndOverride).mockReturnValue(false);

      await expect(guard.canActivate(context)).rejects.toThrow('auth.errors.sessionExpired');
      expect(mockAuthProvider.refresh).not.toHaveBeenCalled();
    });

    it('should throw when no token and no refresh token', async () => {
      const context = createMockContext({});
      vi.mocked(mockReflector.getAllAndOverride).mockReturnValue(false);

      await expect(guard.canActivate(context)).rejects.toThrow('auth.errors.sessionExpired');
    });
  });
});
