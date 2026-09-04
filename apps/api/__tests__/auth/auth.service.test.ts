import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import type { FeatureFlags, IamService } from '@pkg/server';
import type { ConfigService } from '@nestjs/config';
import { SECURITY_CONFIG } from '@pkg/server';
import { getPermissionsForRole, type ActiveUser } from '@pkg/contracts';
import { FakeLogger } from '@pkg/testing';
import * as bcrypt from 'bcryptjs';
import type { Redis } from 'ioredis';
import type { PinoLogger } from 'nestjs-pino';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '@/auth/auth.service.js';
import type { AuthRepository } from '@/auth/auth.repository.js';

const { LOGIN_MAX_ATTEMPTS, LOGIN_LOCKOUT_SECONDS } = SECURITY_CONFIG;

const PASSWORD = 'Str0ng!Password';
// bcrypt is deliberately slow; hash once for the whole suite.
const PASSWORD_HASH = bcrypt.hashSync(PASSWORD, 4);

const TOKENS = { accessToken: 'access', refreshToken: 'refresh' };

const userRow = {
  id: 'user-1',
  email: 'someone@example.com',
  name: 'Someone',
  passwordHash: PASSWORD_HASH,
  systemRole: 'USER' as const,
};

const orgAccess = { orgId: 'org-1', userId: 'user-1', role: 'OWNER' as const };

describe('AuthService', () => {
  let service: AuthService;
  let repository: Record<string, ReturnType<typeof vi.fn>>;
  let redis: Record<string, ReturnType<typeof vi.fn>>;
  let issueTokens: ReturnType<typeof vi.fn>;
  let revokeAllForUser: ReturnType<typeof vi.fn>;
  let resolveFeatures: ReturnType<typeof vi.fn>;
  let registrationEnabled: boolean;
  let logger: FakeLogger;

  beforeEach(() => {
    repository = {
      findUserByEmail: vi.fn().mockResolvedValue(null),
      findUserById: vi.fn().mockResolvedValue(null),
      findUserWithOrg: vi.fn().mockResolvedValue(null),
      findFirstOrgForUser: vi.fn().mockResolvedValue(orgAccess),
      createUserWithOrganization: vi.fn(),
      updatePassword: vi.fn().mockResolvedValue(undefined),
    };
    redis = {
      get: vi.fn().mockResolvedValue(null),
      incr: vi.fn().mockResolvedValue(1),
      expire: vi.fn().mockResolvedValue(1),
      del: vi.fn().mockResolvedValue(1),
    };
    issueTokens = vi.fn().mockResolvedValue(TOKENS);
    revokeAllForUser = vi.fn().mockResolvedValue(undefined);
    resolveFeatures = vi.fn().mockResolvedValue([]);
    logger = new FakeLogger();

    registrationEnabled = true;
    service = new AuthService(
      { auth: { issueTokens, revokeAllForUser, refresh: vi.fn() } } as unknown as IamService,
      repository as unknown as AuthRepository,
      { resolveFeatures } as unknown as FeatureFlags,
      {
        get: (key: string) =>
          key === 'AUTH_REGISTRATION_ENABLED' ? registrationEnabled : undefined,
      } as unknown as ConfigService,
      redis as unknown as Redis,
      logger.as<PinoLogger>(),
    );
  });

  describe('login', () => {
    it('issues tokens for correct credentials', async () => {
      repository.findUserByEmail!.mockResolvedValue(userRow);

      const result = await service.login({ email: userRow.email, password: PASSWORD });

      expect(result.accessToken).toBe(TOKENS.accessToken);
      expect(result.response.user.email).toBe(userRow.email);
      expect(issueTokens).toHaveBeenCalledWith({
        orgId: 'org-1',
        userId: 'user-1',
        orgRole: 'OWNER',
        systemRole: 'USER',
      });
    });

    it('clears the failed-attempt counter on success', async () => {
      repository.findUserByEmail!.mockResolvedValue(userRow);

      await service.login({ email: userRow.email, password: PASSWORD });

      expect(redis.del).toHaveBeenCalledWith(`iam:login-attempts:${userRow.email}`);
    });

    it('rejects a wrong password and counts the attempt', async () => {
      repository.findUserByEmail!.mockResolvedValue(userRow);

      await expect(service.login({ email: userRow.email, password: 'wrong' })).rejects.toThrow(
        UnauthorizedException,
      );
      expect(redis.incr).toHaveBeenCalledWith(`iam:login-attempts:${userRow.email}`);
    });

    it('sets the lockout window only on the first failure', async () => {
      repository.findUserByEmail!.mockResolvedValue(userRow);

      redis.incr!.mockResolvedValue(1);
      await expect(service.login({ email: userRow.email, password: 'wrong' })).rejects.toThrow();
      expect(redis.expire).toHaveBeenCalledWith(expect.any(String), LOGIN_LOCKOUT_SECONDS);

      redis.expire!.mockClear();
      redis.incr!.mockResolvedValue(2);
      await expect(service.login({ email: userRow.email, password: 'wrong' })).rejects.toThrow();
      // A second expire would slide the window forward on every attempt,
      // letting an attacker keep it open indefinitely.
      expect(redis.expire).not.toHaveBeenCalled();
    });

    it('locks the account once the attempt limit is reached', async () => {
      repository.findUserByEmail!.mockResolvedValue(userRow);
      redis.get!.mockResolvedValue(String(LOGIN_MAX_ATTEMPTS));

      await expect(
        // Correct password — lockout must win regardless.
        service.login({ email: userRow.email, password: PASSWORD }),
      ).rejects.toThrow(UnauthorizedException);
      expect(issueTokens).not.toHaveBeenCalled();
      expect(logger.logged('locked', 'warn')).toBe(true);
    });

    it('rejects an unknown email without touching redis', async () => {
      repository.findUserByEmail!.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@example.com', password: PASSWORD }),
      ).rejects.toThrow(UnauthorizedException);
      // Writing attempt counters for addresses that do not exist would let an
      // attacker fill redis with arbitrary keys.
      expect(redis.incr).not.toHaveBeenCalled();
      expect(redis.get).not.toHaveBeenCalled();
    });

    it('gives the same error for an unknown email and a wrong password', async () => {
      repository.findUserByEmail!.mockResolvedValue(null);
      const unknown = await service
        .login({ email: 'nobody@example.com', password: PASSWORD })
        .catch((e) => e);

      repository.findUserByEmail!.mockResolvedValue(userRow);
      const wrong = await service
        .login({ email: userRow.email, password: 'wrong' })
        .catch((e) => e);

      // Different messages would let an attacker enumerate registered addresses.
      expect(unknown.message).toBe(wrong.message);
    });

    it('refuses a user who belongs to no organization', async () => {
      repository.findUserByEmail!.mockResolvedValue(userRow);
      repository.findFirstOrgForUser!.mockResolvedValue(null);

      await expect(service.login({ email: userRow.email, password: PASSWORD })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('register', () => {
    // The default posture: closed. Hiding the page client-side is rendering;
    // this is the enforcement.
    it('refuses when registration is disabled', async () => {
      registrationEnabled = false;

      await expect(
        service.register({
          email: 'new@example.com',
          password: PASSWORD,
          name: 'New',
          organizationName: 'Org',
        }),
      ).rejects.toThrow(ForbiddenException);
      expect(repository.createUserWithOrganization).not.toHaveBeenCalled();
    });

    it('creates the user with an organization and issues tokens', async () => {
      repository.createUserWithOrganization!.mockResolvedValue({
        user: { id: 'user-1', email: userRow.email, name: 'Someone' },
        orgUser: orgAccess,
      });

      const result = await service.register({
        email: userRow.email,
        password: PASSWORD,
        name: 'Someone',
        organizationName: 'Acme',
      });

      expect(result.response.user.id).toBe('user-1');
      expect(result.accessToken).toBe(TOKENS.accessToken);
    });

    it('never stores the password in plain text', async () => {
      repository.createUserWithOrganization!.mockResolvedValue({
        user: { id: 'user-1', email: userRow.email, name: 'Someone' },
        orgUser: orgAccess,
      });

      await service.register({
        email: userRow.email,
        password: PASSWORD,
        name: 'Someone',
        organizationName: 'Acme',
      });

      const { passwordHash } = repository.createUserWithOrganization!.mock.calls[0]![0] as {
        passwordHash: string;
      };
      expect(passwordHash).not.toBe(PASSWORD);
      expect(bcrypt.compareSync(PASSWORD, passwordHash)).toBe(true);
    });

    it('rejects a taken email without revealing that it is taken', async () => {
      repository.findUserByEmail!.mockResolvedValue(userRow);

      const error = await service
        .register({ email: userRow.email, password: PASSWORD, name: 'x', organizationName: 'y' })
        .catch((e) => e);

      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.message).not.toContain('exists');
      expect(repository.createUserWithOrganization).not.toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    const dto = { currentPassword: PASSWORD, newPassword: 'An0ther!Password' };

    it('stores a new hash when the current password matches', async () => {
      repository.findUserById!.mockResolvedValue(userRow);

      await service.changePassword('user-1', dto);

      const [, newHash] = repository.updatePassword!.mock.calls[0] as [string, string];
      expect(bcrypt.compareSync(dto.newPassword, newHash)).toBe(true);
    });

    it('rejects a wrong current password', async () => {
      repository.findUserById!.mockResolvedValue(userRow);

      await expect(
        service.changePassword('user-1', { ...dto, currentPassword: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(repository.updatePassword).not.toHaveBeenCalled();
    });

    it('rejects reusing the current password', async () => {
      repository.findUserById!.mockResolvedValue(userRow);

      await expect(
        service.changePassword('user-1', { currentPassword: PASSWORD, newPassword: PASSWORD }),
      ).rejects.toThrow(ConflictException);
      expect(repository.updatePassword).not.toHaveBeenCalled();
    });

    it('rejects an unknown user', async () => {
      repository.findUserById!.mockResolvedValue(null);

      await expect(service.changePassword('ghost', dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getMe', () => {
    // The response contract types both ids as uuids, so the fixtures must be real ones.
    const USER_UUID = '11111111-1111-4111-8111-111111111111';
    const ORG_UUID = '22222222-2222-4222-8222-222222222222';
    const activeUser: ActiveUser = {
      userId: USER_UUID,
      orgId: ORG_UUID,
      orgRole: 'OWNER',
      systemRole: 'USER',
    };
    const row = {
      id: USER_UUID,
      email: userRow.email,
      name: 'Someone',
      displayName: null,
      role: 'OWNER',
      systemRole: 'USER',
      orgId: ORG_UUID,
    };

    it('returns the user in the context of the active organization', async () => {
      repository.findUserWithOrg!.mockResolvedValue(row);

      const me = await service.getMe(activeUser);

      expect(me.orgId).toBe(ORG_UUID);
      expect(repository.findUserWithOrg).toHaveBeenCalledWith(USER_UUID, ORG_UUID);
    });

    // Sent rather than derived, so a client never needs its own copy of the
    // permission table — the reason an old mobile build stays correct.
    it('resolves the permissions for the role and sends them', async () => {
      repository.findUserWithOrg!.mockResolvedValue(row);

      const me = await service.getMe(activeUser);

      expect(me.permissions).toEqual(getPermissionsForRole('OWNER'));
      expect(me.permissions).toContain('user:create');
    });

    it('sends the narrower list for a lesser role', async () => {
      repository.findUserWithOrg!.mockResolvedValue({ ...row, role: 'MEMBER' });

      const me = await service.getMe(activeUser);

      expect(me.permissions).toEqual(getPermissionsForRole('MEMBER'));
      expect(me.permissions).not.toContain('user:create');
    });

    // Features ride /auth/me beside permissions and come from the resolver —
    // the client never evaluates flags itself.
    it('sends the features the resolver reports, keyed to the session user', async () => {
      repository.findUserWithOrg!.mockResolvedValue(row);
      resolveFeatures.mockResolvedValue(['example-feature']);

      const me = await service.getMe(activeUser);

      expect(me.features).toEqual(['example-feature']);
      expect(resolveFeatures).toHaveBeenCalledWith(activeUser);
    });

    it('rejects a session whose membership no longer exists', async () => {
      repository.findUserWithOrg!.mockResolvedValue(null);

      await expect(service.getMe(activeUser)).rejects.toThrow(UnauthorizedException);
    });

    it('refuses to return a field the response contract does not declare', async () => {
      repository.findUserWithOrg!.mockResolvedValue({ ...row, passwordHash: 'leaked' });

      // The strict response schema is what stops a widened repository query
      // from quietly shipping new columns to the client.
      await expect(service.getMe(activeUser)).rejects.toThrow();
    });
  });

  describe('logoutAllDevices', () => {
    it('revokes every session for the user', async () => {
      await service.logoutAllDevices('user-1');

      expect(revokeAllForUser).toHaveBeenCalledWith('user-1');
    });
  });
});
