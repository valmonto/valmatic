import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { JwtService } from '@nestjs/jwt';
import { TokenExpiredError } from '@nestjs/jwt';
import {
  LocalAuthGuard,
  extractAccessToken,
  extractRefreshToken,
} from '../../../../../src/modules/iam/auth-providers/local/local-auth.guard';
import type { IAuthProvider } from '../../../../../src/modules/iam/auth-providers/auth-provider';

describe('Token Extraction', () => {
  const createMockRequest = (options: {
    cookies?: Record<string, string>;
    unsignResult?: { valid: boolean; value: string | null };
    authHeader?: string;
  }) => ({
    cookies: options.cookies,
    unsignCookie: vi.fn().mockReturnValue(options.unsignResult ?? { valid: false, value: null }),
    headers: options.authHeader ? { authorization: options.authHeader } : {},
  });

  describe('extractAccessToken', () => {
    it('should extract token from valid signed cookie', () => {
      const req = createMockRequest({
        cookies: { accessToken: 'signed-token' },
        unsignResult: { valid: true, value: 'actual-token' },
      });

      expect(extractAccessToken(req)).toBe('actual-token');
    });

    it('should fallback to Bearer header when cookie is invalid', () => {
      const req = createMockRequest({
        cookies: { accessToken: 'invalid-signed' },
        unsignResult: { valid: false, value: null },
        authHeader: 'Bearer header-token',
      });

      expect(extractAccessToken(req)).toBe('header-token');
    });

    it('should extract token from Bearer header when no cookie', () => {
      const req = createMockRequest({
        authHeader: 'Bearer my-jwt-token',
      });

      expect(extractAccessToken(req)).toBe('my-jwt-token');
    });

    it('should return null when no token sources available', () => {
      const req = createMockRequest({});

      expect(extractAccessToken(req)).toBeNull();
    });

    it('should return null for non-Bearer auth header', () => {
      const req = createMockRequest({
        authHeader: 'Basic somebase64',
      });

      expect(extractAccessToken(req)).toBeNull();
    });

    it('should prefer cookie over header when both valid', () => {
      const req = createMockRequest({
        cookies: { accessToken: 'signed-cookie' },
        unsignResult: { valid: true, value: 'cookie-token' },
        authHeader: 'Bearer header-token',
      });

      expect(extractAccessToken(req)).toBe('cookie-token');
    });
  });

  describe('extractRefreshToken', () => {
    it('should extract token from valid signed cookie', () => {
      const req = createMockRequest({
        cookies: { refreshToken: 'signed-refresh' },
        unsignResult: { valid: true, value: 'refresh-token' },
      });

      expect(extractRefreshToken(req)).toBe('refresh-token');
    });

    it('should return null when cookie is invalid', () => {
      const req = createMockRequest({
        cookies: { refreshToken: 'invalid' },
        unsignResult: { valid: false, value: null },
      });

      expect(extractRefreshToken(req)).toBeNull();
    });

    it('should return null when no refresh cookie', () => {
      const req = createMockRequest({});

      expect(extractRefreshToken(req)).toBeNull();
    });
  });
});

describe('LocalAuthGuard', () => {
  let guard: LocalAuthGuard;
  let mockReflector: Reflector;
  let mockJwtService: JwtService;
  let mockAuthProvider: IAuthProvider;

  const createMockContext = (options: {
    cookies?: Record<string, string>;
    unsignResult?: { valid: boolean; value: string | null };
    authHeader?: string;
    user?: unknown;
  } = {}): ExecutionContext => {
    const request = {
      cookies: options.cookies,
      unsignCookie: vi.fn().mockReturnValue(options.unsignResult ?? { valid: false, value: null }),
      headers: options.authHeader ? { authorization: options.authHeader } : {},
      user: options.user,
    };
    const response = {
      setCookie: vi.fn(),
    };

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

    guard = new LocalAuthGuard(mockReflector, mockJwtService, mockAuthProvider);
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
        role: 'ADMIN',
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
        role: 'ADMIN',
      });
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
        role: 'ADMIN',
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
        role: 'ADMIN',
        iat: 1234567890,
      });
      vi.mocked(mockAuthProvider.isAccessTokenBlacklisted).mockResolvedValue(false);
      vi.mocked(mockAuthProvider.isTokenIssuedBeforeLogoutAll).mockResolvedValue(true);

      await expect(guard.canActivate(context)).rejects.toThrow('auth.errors.sessionInvalidated');
    });

    it('should try refresh when token is expired', async () => {
      const context = createMockContext({
        authHeader: 'Bearer expired-token',
        cookies: { refreshToken: 'signed-refresh' },
        unsignResult: { valid: true, value: 'refresh-token' },
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
    });

    it('should throw when no token and no refresh token', async () => {
      const context = createMockContext({});
      vi.mocked(mockReflector.getAllAndOverride).mockReturnValue(false);

      await expect(guard.canActivate(context)).rejects.toThrow('auth.errors.sessionExpired');
    });
  });
});
