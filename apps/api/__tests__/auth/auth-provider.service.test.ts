import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { IamService } from '@pkg/server';
import { FakeLogger } from '@pkg/testing';
import type { PinoLogger } from 'nestjs-pino';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProviderService, NO_PASSWORD } from '@/auth/provider/auth-provider.service.js';
import type { AuthProviderRepository } from '@/auth/provider/auth-provider.repository.js';
import type { IdentityTokenVerifier } from '@/auth/provider/identity-token.verifier.js';
import type { AuthRepository } from '@/auth/auth.repository.js';
import { ProviderTokens } from '@/auth/provider/provider-tokens.js';
import { MemoryRedis } from './memory-redis.js';

const ORG = '00000000-0000-4000-8000-00000000000a';
const USER = '00000000-0000-4000-8000-0000000000e1';
const TOKENS = { accessToken: 'access', refreshToken: 'refresh' };

type Fn = ReturnType<typeof vi.fn>;

const account = (overrides: Record<string, unknown> = {}) => ({
  id: USER,
  email: 'person@example.com',
  name: 'Person',
  systemRole: 'USER' as const,
  disabledAt: null,
  ...overrides,
});

/**
 * Verify, then find, then link, then create — the order is the security of
 * this feature. Each step and each refusal is pinned here; the token check
 * itself is in identity-token.verifier.test.ts and the writes in the
 * repository test.
 */
describe('AuthProviderService', () => {
  let service: AuthProviderService;
  let verifier: { isConfigured: Fn; verify: Fn };
  let identities: {
    findIdentity: Fn;
    touch: Fn;
    findUserByEmail: Fn;
    linkIdentity: Fn;
    createAccount: Fn;
  };
  let issueTokens: Fn;
  let revokeAllForUser: Fn;
  let registration: boolean;
  let redis: MemoryRedis;

  beforeEach(() => {
    registration = true;
    verifier = { isConfigured: vi.fn().mockReturnValue(true), verify: vi.fn() };
    identities = {
      findIdentity: vi.fn().mockResolvedValue(null),
      touch: vi.fn().mockResolvedValue(undefined),
      findUserByEmail: vi.fn().mockResolvedValue(null),
      linkIdentity: vi.fn().mockResolvedValue({ identity: {}, claimed: false }),
      createAccount: vi.fn().mockResolvedValue(account({ id: 'new-user' })),
    };
    issueTokens = vi.fn().mockResolvedValue(TOKENS);
    revokeAllForUser = vi.fn().mockResolvedValue(undefined);
    redis = new MemoryRedis();
    service = new AuthProviderService(
      verifier as unknown as IdentityTokenVerifier,
      new ProviderTokens(redis as never),
      identities as unknown as AuthProviderRepository,
      {
        findFirstOrgForUser: vi.fn().mockResolvedValue({ orgId: ORG, role: 'OWNER' }),
      } as unknown as AuthRepository,
      { auth: { issueTokens, revokeAllForUser } } as unknown as IamService,
      {
        get: (key: string) => (key === 'AUTH_REGISTRATION_ENABLED' ? registration : undefined),
      } as unknown as ConfigService,
      new FakeLogger() as unknown as PinoLogger,
    );
  });

  const verified = (overrides: Record<string, unknown> = {}) => {
    verifier.verify.mockResolvedValue({
      provider: 'google',
      subject: 'sub-123',
      email: 'person@example.com',
      emailVerified: true,
      name: 'Person',
      nonce: null,
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
      ...overrides,
    });
  };
  const google = (identityToken = 'good') => service.signIn({ provider: 'google', identityToken });

  it('offers only the providers it has a client id for', () => {
    verifier.isConfigured = vi.fn((provider: string) => provider === 'apple');
    expect(service.available()).toEqual(['apple']);
  });

  it('refuses a provider it cannot verify, without looking at the token', async () => {
    verifier.isConfigured.mockReturnValue(false);
    await expect(google()).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(verifier.verify).not.toHaveBeenCalled();
  });

  it('refuses a token that does not verify with one generic 401, and creates nothing', async () => {
    verifier.verify.mockRejectedValue(new Error('signature verification failed'));
    await expect(google()).rejects.toBeInstanceOf(UnauthorizedException);
    expect(identities.findIdentity).not.toHaveBeenCalled();
    expect(identities.createAccount).not.toHaveBeenCalled();
  });

  it('signs a known subject in to that account', async () => {
    verified();
    identities.findIdentity.mockResolvedValue({ identity: { id: 'link-1' }, user: account() });
    const out = await google();
    expect(out.response).toEqual({
      user: { id: USER, email: 'person@example.com', name: 'Person' },
      created: false,
    });
    expect(identities.touch).toHaveBeenCalledWith('link-1');
    expect(issueTokens).toHaveBeenCalledWith({
      orgId: ORG,
      userId: USER,
      orgRole: 'OWNER',
      systemRole: 'USER',
    });
    expect(identities.createAccount).not.toHaveBeenCalled();
  });

  it('refuses a disabled account even with a good token', async () => {
    verified();
    identities.findIdentity.mockResolvedValue({
      identity: { id: 'link-1' },
      user: account({ disabledAt: new Date() }),
    });
    await expect(google()).rejects.toBeInstanceOf(ForbiddenException);
    expect(issueTokens).not.toHaveBeenCalled();
  });

  it('links to the account holding an address the provider verified', async () => {
    verified();
    identities.findUserByEmail.mockResolvedValue(account());
    await google();
    expect(identities.linkIdentity).toHaveBeenCalledWith({
      userId: USER,
      provider: 'google',
      subject: 'sub-123',
      email: 'person@example.com',
      noPassword: NO_PASSWORD,
    });
    expect(revokeAllForUser).not.toHaveBeenCalled();
  });

  it('ends the sessions of an unconfirmed account it takes back from a password', async () => {
    verified();
    identities.findUserByEmail.mockResolvedValue(account());
    identities.linkIdentity.mockResolvedValue({ identity: {}, claimed: true });
    await google();
    expect(revokeAllForUser).toHaveBeenCalledWith(USER);
  });

  it('never links a platform admin: they sign in with their password', async () => {
    verified();
    identities.findUserByEmail.mockResolvedValue(account({ systemRole: 'ADMIN' }));
    await expect(google()).rejects.toBeInstanceOf(ConflictException);
    expect(identities.linkIdentity).not.toHaveBeenCalled();
  });

  it('never links on an address the provider did not verify', async () => {
    verified({ emailVerified: false });
    identities.findUserByEmail.mockResolvedValue(account());
    await expect(google()).rejects.toBeInstanceOf(BadRequestException);
    expect(identities.linkIdentity).not.toHaveBeenCalled();
    expect(identities.createAccount).not.toHaveBeenCalled();
  });

  it('creates an account with an organization of its own for a new person', async () => {
    verified();
    const out = await google();
    expect(out.response.created).toBe(true);
    expect(identities.createAccount).toHaveBeenCalledWith({
      email: 'person@example.com',
      name: 'Person',
      passwordHash: NO_PASSWORD,
      emailVerified: true,
      organizationName: 'Person',
      provider: 'google',
      subject: 'sub-123',
      providerEmail: 'person@example.com',
    });
  });

  it('creates nobody while sign-up is closed', async () => {
    registration = false;
    verified();
    await expect(google()).rejects.toBeInstanceOf(ForbiddenException);
    expect(identities.createAccount).not.toHaveBeenCalled();
  });

  it("names a new Apple account from the app's fullName, and one with no address by its subject", async () => {
    const { nonce } = await service.nonce();
    verified({ provider: 'apple', email: null, emailVerified: false, name: null, nonce });
    await service.signIn({ provider: 'apple', identityToken: 'a', nonce, fullName: 'Ada L' });
    expect(identities.createAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'apple-sub-123@provider.invalid',
        name: 'Ada L',
        emailVerified: false,
      }),
    );
  });

  describe('a copied token signs nobody in', () => {
    it('refuses the same token a second time', async () => {
      verified();
      await google();
      await expect(google()).rejects.toBeInstanceOf(UnauthorizedException);
      expect(issueTokens).toHaveBeenCalledTimes(1);
      // Only a hash of the token is kept.
      expect([...redis.values.keys()].some((key) => key.includes('good'))).toBe(false);
    });

    it('signs in with Apple when the token carries the nonce this server handed out', async () => {
      const { nonce } = await service.nonce();
      verified({ provider: 'apple', nonce });
      await service.signIn({ provider: 'apple', identityToken: 'good', nonce });
      expect(issueTokens).toHaveBeenCalledTimes(1);
    });

    it('refuses an Apple token with no nonce in it', async () => {
      verified({ provider: 'apple', nonce: null });
      await expect(
        service.signIn({ provider: 'apple', identityToken: 'good' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('refuses an Apple token whose nonce is not the one sent with it', async () => {
      const { nonce } = await service.nonce();
      verified({ provider: 'apple', nonce: 'some-other-sign-in-nonce' });
      await expect(
        service.signIn({ provider: 'apple', identityToken: 'good', nonce }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('refuses a nonce this server never handed out', async () => {
      const nonce = 'made-up-by-the-caller-0123456789';
      verified({ provider: 'apple', nonce });
      await expect(
        service.signIn({ provider: 'apple', identityToken: 'good', nonce }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('refuses a nonce the second time, even with a fresh token', async () => {
      const { nonce } = await service.nonce();
      verified({ provider: 'apple', nonce });
      await service.signIn({ provider: 'apple', identityToken: 'first', nonce });
      await expect(
        service.signIn({ provider: 'apple', identityToken: 'second', nonce }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('holds a Google token that carries a nonce to the same rule', async () => {
      verified({ nonce: 'not-one-of-ours-0123456789' });
      await expect(google()).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('provesOwner (confirming an account deletion)', () => {
    const proof = { provider: 'google' as const, identityToken: 'fresh' };

    it('is true for a fresh token of a provider linked to the account', async () => {
      verified();
      identities.findIdentity.mockResolvedValue({ identity: { id: 'l' }, user: account() });
      expect(await service.provesOwner(USER, proof)).toBe(true);
    });

    it("is false for someone else's provider account", async () => {
      verified();
      identities.findIdentity.mockResolvedValue({
        identity: { id: 'l' },
        user: account({ id: 'someone-else' }),
      });
      expect(await service.provesOwner(USER, proof)).toBe(false);
    });

    it('is false, not a 401, for a token that does not verify', async () => {
      verifier.verify.mockRejectedValue(new Error('expired'));
      expect(await service.provesOwner(USER, proof)).toBe(false);
    });
  });
});
