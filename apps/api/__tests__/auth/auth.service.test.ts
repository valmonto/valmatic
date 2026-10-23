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
import { MemoryRedis } from './memory-redis.js';
import { ACCOUNT_FAILURES_MAX, LoginAttempts } from '@/auth/login-attempts.js';
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

/** A visitor's address, as the route hands it on. */
const IP = '203.0.113.7';

describe('AuthService', () => {
  let service: AuthService;
  let repository: Record<string, ReturnType<typeof vi.fn>>;
  let redis: MemoryRedis;
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
      findProvidersForUser: vi.fn().mockResolvedValue([]),
      findFirstOrgForUser: vi.fn().mockResolvedValue(orgAccess),
      createUserWithOrganization: vi.fn(),
      updatePassword: vi.fn().mockResolvedValue(undefined),
    };
    redis = new MemoryRedis();
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
      new LoginAttempts(redis as unknown as Redis),
      logger.as<PinoLogger>(),
    );
  });

  describe('login', () => {
    it('issues tokens for correct credentials', async () => {
      repository.findUserByEmail!.mockResolvedValue(userRow);

      const result = await service.login({ email: userRow.email, password: PASSWORD }, IP);

      expect(result.accessToken).toBe(TOKENS.accessToken);
      expect(result.response.user.email).toBe(userRow.email);
      expect(issueTokens).toHaveBeenCalledWith({
        orgId: 'org-1',
        userId: 'user-1',
        orgRole: 'OWNER',
        systemRole: 'USER',
      });
    });

    const visitorKey = (email: string, ip = IP) => `iam:login-attempts:${email}:${ip}`;
    const fail = (email = userRow.email, ip = IP) =>
      expect(service.login({ email, password: 'wrong' }, ip)).rejects.toThrow(
        UnauthorizedException,
      );

    it('clears the failed-attempt counter on success', async () => {
      repository.findUserByEmail!.mockResolvedValue(userRow);
      await fail();

      await service.login({ email: userRow.email, password: PASSWORD }, IP);

      expect(redis.values.has(visitorKey(userRow.email))).toBe(false);
    });

    it('rejects a wrong password and counts the attempt', async () => {
      repository.findUserByEmail!.mockResolvedValue(userRow);

      await fail();

      expect(redis.values.get(visitorKey(userRow.email))).toBe('1');
    });

    it('sets the lockout window on the first failure', async () => {
      repository.findUserByEmail!.mockResolvedValue(userRow);
      await fail();
      expect(redis.ttl.get(visitorKey(userRow.email))).toBe(LOGIN_LOCKOUT_SECONDS);

      // A second expire would slide the window forward on every attempt,
      // letting an attacker keep it open indefinitely.
      redis.ttl.clear();
      await fail();
      expect(redis.ttl.has(visitorKey(userRow.email))).toBe(false);
    });

    it('locks the visitor out once the attempt limit is reached', async () => {
      repository.findUserByEmail!.mockResolvedValue(userRow);
      redis.values.set(visitorKey(userRow.email), String(LOGIN_MAX_ATTEMPTS));

      await expect(
        // Correct password — lockout must win regardless.
        service.login({ email: userRow.email, password: PASSWORD }, IP),
      ).rejects.toThrow(UnauthorizedException);
      expect(issueTokens).not.toHaveBeenCalled();
      expect(logger.logged('blocked', 'warn')).toBe(true);
    });

    /**
     * "Too many attempts" for real accounts only would tell a stranger which
     * addresses exist, so an unknown address is counted and locked the same.
     */
    it('counts and locks an unknown email exactly like a real one', async () => {
      repository.findUserByEmail!.mockResolvedValue(null);
      await fail('nobody@example.com');
      expect(redis.values.get(visitorKey('nobody@example.com'))).toBe('1');

      redis.values.set(visitorKey('nobody@example.com'), String(LOGIN_MAX_ATTEMPTS));
      redis.values.set(visitorKey(userRow.email), String(LOGIN_MAX_ATTEMPTS));
      const unknown = await service
        .login({ email: 'nobody@example.com', password: PASSWORD }, IP)
        .catch((e) => e);
      repository.findUserByEmail!.mockResolvedValue(userRow);
      const real = await service
        .login({ email: userRow.email, password: PASSWORD }, IP)
        .catch((e) => e);
      expect(unknown.message).toBe(real.message);
    });

    /** Ten wrong passwords from a stranger used to lock the owner out. */
    it('locks out only the visitor who failed, not the account', async () => {
      repository.findUserByEmail!.mockResolvedValue(userRow);
      redis.values.set(visitorKey(userRow.email, '198.51.100.9'), String(LOGIN_MAX_ATTEMPTS));

      await expect(
        service.login({ email: userRow.email, password: PASSWORD }, '198.51.100.9'),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.login({ email: userRow.email, password: PASSWORD }, IP),
      ).resolves.toMatchObject({ accessToken: expect.any(String) });
    });

    /** one machine sends from a whole IPv6 /64; it is one visitor. */
    it('counts every address of one IPv6 /64 as the same visitor', async () => {
      repository.findUserByEmail!.mockResolvedValue(userRow);
      for (let n = 1; n <= LOGIN_MAX_ATTEMPTS; n++) await fail(userRow.email, `2001:db8:1:2::${n}`);

      await expect(
        service.login({ email: userRow.email, password: PASSWORD }, '2001:db8:1:2::ffff'),
      ).rejects.toThrow(UnauthorizedException);
    });

    /**
     * Guessing one account's password from many networks stops after
     * ACCOUNT_FAILURES_MAX in an hour — for strangers. A network the account
     * signed in from before goes on as usual, so this cannot lock the owner out.
     */
    it('turns strangers away from an account guessed at from everywhere, not its owner', async () => {
      repository.findUserByEmail!.mockResolvedValue(userRow);
      await service.login({ email: userRow.email, password: PASSWORD }, IP);
      for (let n = 0; n < ACCOUNT_FAILURES_MAX; n++) await fail(userRow.email, `198.51.100.${n}`);

      await expect(
        service.login({ email: userRow.email, password: PASSWORD }, '192.0.2.200'),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.login({ email: userRow.email, password: PASSWORD }, IP),
      ).resolves.toMatchObject({ accessToken: expect.any(String) });
    });

    /** no account (or one with no password) takes the time a real one does. */
    it('does real bcrypt work for an unknown address and a password-less account', async () => {
      repository.findUserByEmail!.mockResolvedValue(null);
      let started = Date.now();
      await fail('nobody@example.com');
      expect(Date.now() - started).toBeGreaterThan(50);

      repository.findUserByEmail!.mockResolvedValue({ ...userRow, passwordHash: '!provider' });
      started = Date.now();
      await fail();
      expect(Date.now() - started).toBeGreaterThan(50);
      await expect(
        service.login({ email: userRow.email, password: '!provider' }, IP),
      ).rejects.toThrow(UnauthorizedException);
    });

    /** what was typed as the address is not written to the log. */
    it('logs a failed sign-in without the address typed', async () => {
      repository.findUserByEmail!.mockResolvedValue(null);
      await fail('someone.private@example.com');

      expect(JSON.stringify(logger.entries)).not.toContain('someone.private');
    });

    it('gives the same error for an unknown email and a wrong password', async () => {
      repository.findUserByEmail!.mockResolvedValue(null);
      const unknown = await service
        .login({ email: 'nobody@example.com', password: PASSWORD }, IP)
        .catch((e) => e);

      repository.findUserByEmail!.mockResolvedValue(userRow);
      const wrong = await service
        .login({ email: userRow.email, password: 'wrong' }, IP)
        .catch((e) => e);

      // Different messages would let an attacker enumerate registered addresses.
      expect(unknown.message).toBe(wrong.message);
    });

    // Told only to someone who has just proved the account is theirs: a wrong
    // password on a disabled account gets the ordinary 401.
    it('refuses a disabled account only after the password matched, and issues nothing', async () => {
      repository.findUserByEmail!.mockResolvedValue({ ...userRow, disabledAt: new Date() });

      await expect(service.login({ email: userRow.email, password: 'wrong' }, IP)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login({ email: userRow.email, password: PASSWORD }, IP)).rejects.toThrow(
        ForbiddenException,
      );
      expect(issueTokens).not.toHaveBeenCalled();
    });

    it('refuses a user who belongs to no organization', async () => {
      repository.findUserByEmail!.mockResolvedValue(userRow);
      repository.findFirstOrgForUser!.mockResolvedValue(null);

      await expect(service.login({ email: userRow.email, password: PASSWORD }, IP)).rejects.toThrow(
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

    it('with one organization (no add-on), places the account there, named after the person', async () => {
      repository.createUserWithOrganization!.mockResolvedValue({
        user: { id: 'user-1', email: userRow.email, name: 'Someone' },
        orgUser: orgAccess,
      });

      await service.register({ email: userRow.email, password: PASSWORD, name: 'Someone' });

      expect(repository.createUserWithOrganization).toHaveBeenCalledWith(
        expect.objectContaining({ multiOrg: false, organizationName: 'Someone' }),
      );
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
      emailVerified: true,
      hasPassword: true,
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
