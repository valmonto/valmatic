import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Reflector } from '@nestjs/core';
import { AuthGuard } from '../../../../../src/modules/iam/auth-providers/guards/auth.guard';
import type { LocalAuthGuard } from '../../../../../src/modules/iam/auth-providers/local/local-auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let mockConfig: ConfigService;
  let mockReflector: Reflector;
  let mockLocalGuard: LocalAuthGuard;

  const createMockContext = (): ExecutionContext =>
    ({
      getHandler: () => () => {},
      getClass: () => class {},
      switchToHttp: () => ({
        getRequest: () => ({}),
        getResponse: () => ({}),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    mockConfig = {
      getOrThrow: vi.fn(),
    } as unknown as ConfigService;

    mockReflector = {
      getAllAndOverride: vi.fn(),
    } as unknown as Reflector;

    mockLocalGuard = {
      canActivate: vi.fn(),
    } as unknown as LocalAuthGuard;

    guard = new AuthGuard(mockConfig, mockReflector, mockLocalGuard);
  });

  describe('canActivate', () => {
    it('should delegate to LocalAuthGuard when provider is "local"', async () => {
      const context = createMockContext();
      vi.mocked(mockConfig.getOrThrow).mockReturnValue('local');
      vi.mocked(mockLocalGuard.canActivate).mockResolvedValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockLocalGuard.canActivate).toHaveBeenCalledWith(context);
    });

    it('should return false when LocalAuthGuard returns false', async () => {
      const context = createMockContext();
      vi.mocked(mockConfig.getOrThrow).mockReturnValue('local');
      vi.mocked(mockLocalGuard.canActivate).mockResolvedValue(false);

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should throw UnauthorizedException for unsupported provider', async () => {
      const context = createMockContext();
      vi.mocked(mockConfig.getOrThrow).mockReturnValue('oauth');

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should include provider name in error message for unsupported provider', async () => {
      const context = createMockContext();
      vi.mocked(mockConfig.getOrThrow).mockReturnValue('unknown-provider');

      await expect(guard.canActivate(context)).rejects.toThrow(
        'Unsupported provider unknown-provider',
      );
    });

    it('should read IAM_AUTH_PROVIDER from config', async () => {
      const context = createMockContext();
      vi.mocked(mockConfig.getOrThrow).mockReturnValue('local');
      vi.mocked(mockLocalGuard.canActivate).mockResolvedValue(true);

      await guard.canActivate(context);

      expect(mockConfig.getOrThrow).toHaveBeenCalledWith('IAM_AUTH_PROVIDER');
    });

    it('should propagate errors from LocalAuthGuard', async () => {
      const context = createMockContext();
      vi.mocked(mockConfig.getOrThrow).mockReturnValue('local');
      vi.mocked(mockLocalGuard.canActivate).mockRejectedValue(
        new UnauthorizedException('Token expired'),
      );

      await expect(guard.canActivate(context)).rejects.toThrow('Token expired');
    });
  });
});
