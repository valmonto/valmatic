import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import type Redis from 'ioredis';
import type { PinoLogger } from 'nestjs-pino';
import { LocalAuthProvider } from '../../../../../src/modules/iam/auth-providers/local/local-auth.provider';
import type { IOrgAccessProvider } from '../../../../../src/modules/iam/auth-providers/org-access-provider';

describe('LocalAuthProvider', () => {
  let provider: LocalAuthProvider;
  let mockLogger: PinoLogger;
  let mockRedis: Redis;
  let mockJwtService: JwtService;
  let mockOrgAccess: IOrgAccessProvider;
  let mockConfigService: ConfigService;

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    } as unknown as PinoLogger;

    mockRedis = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
      smembers: vi.fn(),
      multi: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnThis(),
        sadd: vi.fn().mockReturnThis(),
        srem: vi.fn().mockReturnThis(),
        del: vi.fn().mockReturnThis(),
        expire: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([]),
      }),
    } as unknown as Redis;

    mockJwtService = {
      signAsync: vi.fn(),
      verifyAsync: vi.fn(),
      decode: vi.fn(),
    } as unknown as JwtService;

    mockOrgAccess = {
      verifyAccess: vi.fn(),
    } as unknown as IOrgAccessProvider;

    mockConfigService = {
      get: vi.fn().mockImplementation((key: string, defaultValue: number) => defaultValue),
    } as unknown as ConfigService;

    provider = new LocalAuthProvider(
      mockLogger,
      mockRedis,
      mockJwtService,
      mockOrgAccess,
      mockConfigService,
    );
  });

  describe('isAccessTokenBlacklisted', () => {
    it('should return true when token is blacklisted', async () => {
      vi.mocked(mockRedis.get).mockResolvedValue('1');

      const result = await provider.isAccessTokenBlacklisted('some-token');

      expect(result).toBe(true);
      expect(mockRedis.get).toHaveBeenCalledWith('iam:blacklist:some-token');
    });

    it('should return false when token is not blacklisted', async () => {
      vi.mocked(mockRedis.get).mockResolvedValue(null);

      const result = await provider.isAccessTokenBlacklisted('valid-token');

      expect(result).toBe(false);
    });
  });

  describe('isTokenIssuedBeforeLogoutAll', () => {
    it('should return true when token was issued before logout', async () => {
      vi.mocked(mockRedis.get).mockResolvedValue('1000');

      const result = await provider.isTokenIssuedBeforeLogoutAll('user-123', 999);

      expect(result).toBe(true);
      expect(mockRedis.get).toHaveBeenCalledWith('iam:logout-all:user-123');
    });

    it('should return true when token was issued at same time as logout', async () => {
      vi.mocked(mockRedis.get).mockResolvedValue('1000');

      const result = await provider.isTokenIssuedBeforeLogoutAll('user-123', 1000);

      expect(result).toBe(true);
    });

    it('should return false when token was issued after logout', async () => {
      vi.mocked(mockRedis.get).mockResolvedValue('1000');

      const result = await provider.isTokenIssuedBeforeLogoutAll('user-123', 1001);

      expect(result).toBe(false);
    });

    it('should return false when no logout timestamp exists', async () => {
      vi.mocked(mockRedis.get).mockResolvedValue(null);

      const result = await provider.isTokenIssuedBeforeLogoutAll('user-123', 1000);

      expect(result).toBe(false);
    });

    it('should return true when issuedAt is undefined', async () => {
      const result = await provider.isTokenIssuedBeforeLogoutAll(
        'user-123',
        undefined as unknown as number,
      );

      expect(result).toBe(true);
      expect(mockRedis.get).not.toHaveBeenCalled();
    });

    it('should return true when issuedAt is null', async () => {
      const result = await provider.isTokenIssuedBeforeLogoutAll(
        'user-123',
        null as unknown as number,
      );

      expect(result).toBe(true);
      expect(mockRedis.get).not.toHaveBeenCalled();
    });
  });

  describe('blacklistAccessToken', () => {
    it('should blacklist token with correct TTL', async () => {
      const now = Math.floor(Date.now() / 1000);
      const exp = now + 300; // 5 minutes from now
      vi.mocked(mockJwtService.decode).mockReturnValue({ exp });

      await provider.blacklistAccessToken('my-token');

      expect(mockJwtService.decode).toHaveBeenCalledWith('my-token');
      expect(mockRedis.set).toHaveBeenCalledWith(
        'iam:blacklist:my-token',
        '1',
        'EX',
        expect.any(Number),
      );
    });

    it('should not blacklist already expired token', async () => {
      const now = Math.floor(Date.now() / 1000);
      const exp = now - 100; // expired 100 seconds ago
      vi.mocked(mockJwtService.decode).mockReturnValue({ exp });

      await provider.blacklistAccessToken('expired-token');

      expect(mockRedis.set).not.toHaveBeenCalled();
    });

    it('should not blacklist token without exp claim', async () => {
      vi.mocked(mockJwtService.decode).mockReturnValue({});

      await provider.blacklistAccessToken('no-exp-token');

      expect(mockRedis.set).not.toHaveBeenCalled();
    });

    it('should not blacklist when decode returns null', async () => {
      vi.mocked(mockJwtService.decode).mockReturnValue(null);

      await provider.blacklistAccessToken('invalid-token');

      expect(mockRedis.set).not.toHaveBeenCalled();
    });
  });

  describe('verifyToken', () => {
    it('should return userId from verified token', async () => {
      vi.mocked(mockJwtService.verifyAsync).mockResolvedValue({ sub: 'user-123' });

      const result = await provider.verifyToken({ token: 'valid-token' });

      expect(result).toEqual({ userId: 'user-123' });
    });
  });

  describe('revokeToken', () => {
    it('should revoke token and return userId', async () => {
      vi.mocked(mockRedis.get).mockResolvedValue(
        JSON.stringify({ userId: 'user-123', orgId: 'org-456', role: 'ADMIN', sessionStart: 1000 }),
      );

      const result = await provider.revokeToken({ token: 'refresh-token' });

      expect(result).toEqual({ userId: 'user-123' });
      expect(mockRedis.get).toHaveBeenCalledWith('iam:refresh:refresh-token');
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      vi.mocked(mockRedis.get).mockResolvedValue(null);

      await expect(provider.revokeToken({ token: 'invalid-token' })).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(provider.revokeToken({ token: 'invalid-token' })).rejects.toThrow(
        'auth.errors.invalidRefreshToken',
      );
    });
  });

  describe('refresh', () => {
    it('should throw UnauthorizedException for invalid refresh token', async () => {
      vi.mocked(mockRedis.get).mockResolvedValue(null);

      await expect(provider.refresh({ refreshToken: 'invalid' })).rejects.toThrow(
        'auth.errors.invalidRefreshToken',
      );
    });

    it('should throw UnauthorizedException when session expired', async () => {
      const sessionStart = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago
      vi.mocked(mockRedis.get).mockResolvedValue(
        JSON.stringify({ userId: 'user-123', orgId: 'org-456', role: 'ADMIN', sessionStart }),
      );

      await expect(provider.refresh({ refreshToken: 'old-token' })).rejects.toThrow(
        'auth.errors.sessionExpiredPleaseLogin',
      );
    });

    it('should throw UnauthorizedException when org access revoked', async () => {
      const sessionStart = Date.now() - 1000; // 1 second ago
      vi.mocked(mockRedis.get).mockResolvedValue(
        JSON.stringify({ userId: 'user-123', orgId: 'org-456', role: 'ADMIN', sessionStart }),
      );
      vi.mocked(mockOrgAccess.verifyAccess).mockResolvedValue(null);

      await expect(provider.refresh({ refreshToken: 'valid-token' })).rejects.toThrow(
        'auth.errors.orgAccessRevoked',
      );
    });

    it('should return new tokens on successful refresh', async () => {
      const sessionStart = Date.now() - 1000;
      vi.mocked(mockRedis.get).mockResolvedValue(
        JSON.stringify({ userId: 'user-123', orgId: 'org-456', role: 'ADMIN', sessionStart }),
      );
      vi.mocked(mockOrgAccess.verifyAccess).mockResolvedValue({ role: 'ADMIN' });
      vi.mocked(mockJwtService.signAsync).mockResolvedValue('new-access-token');

      const result = await provider.refresh({ refreshToken: 'valid-refresh' });

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBeDefined();
      expect(result.refreshToken).not.toBe('valid-refresh');
    });
  });

  describe('revokeAllForUser', () => {
    it('should delete all sessions when sessions exist', async () => {
      vi.mocked(mockRedis.smembers).mockResolvedValue(['session1', 'session2']);

      await provider.revokeAllForUser('user-123');

      expect(mockRedis.smembers).toHaveBeenCalledWith('iam:user-sessions:user-123');
      expect(mockRedis.multi).toHaveBeenCalled();
    });

    it('should only set logout timestamp when no sessions exist', async () => {
      vi.mocked(mockRedis.smembers).mockResolvedValue([]);

      await provider.revokeAllForUser('user-123');

      expect(mockRedis.set).toHaveBeenCalledWith(
        'iam:logout-all:user-123',
        expect.any(String),
        'EX',
        expect.any(Number),
      );
    });
  });
});
