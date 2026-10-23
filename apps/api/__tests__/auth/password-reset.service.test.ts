import type { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import {
  createDatabaseClient,
  eq,
  organization,
  organizationUser,
  passwordReset,
  user,
  type DatabaseClient,
} from '@pkg/database';
import type { IamService } from '@pkg/server';
import { FakeLogger, describeIntegration, truncate } from '@pkg/testing';
import type { Redis } from 'ioredis';
import { MemoryRedis } from './memory-redis.js';
import { LoginAttempts } from '@/auth/login-attempts.js';
import type { PinoLogger } from 'nestjs-pino';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PasswordResetRepository } from '@/auth/password-reset/password-reset.repository.js';
import {
  PasswordResetService,
  RESET_EMAILS_PER_DAY,
  RESET_LINK_MINUTES,
  resetLink,
} from '@/auth/password-reset/password-reset.service.js';
import type { MailService, OutgoingMail } from '@/mail/mail.service.js';

/**
 * "I forgot my password", against a real database.
 *
 * The mail service, the session store and Redis are stand-ins; the rows are
 * real, because every promise this flow makes — one use, one hour, five a
 * day, an older link dead once a newer one is used — is kept in SQL.
 */
describeIntegration('PasswordResetService', () => {
  const client: DatabaseClient = createDatabaseClient({ url: process.env.DATABASE_URL! });
  const tables = [passwordReset, organizationUser, organization, user];

  let outbox: OutgoingMail[];
  let mail: { isConfigured: boolean; send: (m: OutgoingMail) => Promise<boolean> };
  let revokeAllForUser: ReturnType<typeof vi.fn>;
  let redis: MemoryRedis;
  let service: PasswordResetService;
  let orgId: string;

  const OLD_HASH = '$2a$04$abcdefghijklmnopqrstuuJ8m1Xo0m4Vq0oQ1m1m1m1m1m1m1m1m1';

  async function makeUser(
    email: string,
    role: 'OWNER' | 'ADMIN' | 'MEMBER' = 'MEMBER',
    extra: Partial<typeof user.$inferInsert> = {},
  ): Promise<string> {
    const [row] = await client.db
      .insert(user)
      .values({ email, name: email, passwordHash: OLD_HASH, ...extra })
      .returning();
    await client.db.insert(organizationUser).values({ orgId, userId: row!.id, role });
    return row!.id;
  }

  /** The token out of the link in the last email sent. */
  const tokenFromLastMail = (): string => {
    const match = /#token=([\w-]+)/.exec(outbox.at(-1)!.text);
    return match![1]!;
  };

  const passwordHashOf = async (userId: string): Promise<string> => {
    const [row] = await client.db.select().from(user).where(eq(user.id, userId));
    return row!.passwordHash;
  };

  beforeEach(async () => {
    await truncate(client.db, tables);
    const [owner] = await client.db
      .insert(user)
      .values({ email: 'owner@school.test', name: 'Owner', passwordHash: OLD_HASH })
      .returning();
    const [org] = await client.db
      .insert(organization)
      .values({ name: 'School', ownerId: owner!.id })
      .returning();
    orgId = org!.id;
    await client.db.insert(organizationUser).values({ orgId, userId: owner!.id, role: 'OWNER' });

    outbox = [];
    mail = {
      isConfigured: true,
      send: async (message) => {
        outbox.push(message);
        return true;
      },
    };
    revokeAllForUser = vi.fn().mockResolvedValue(undefined);
    redis = new MemoryRedis();
    service = new PasswordResetService(
      new PasswordResetRepository(client),
      mail as unknown as MailService,
      { auth: { revokeAllForUser } } as unknown as IamService,
      {
        get: (key: string) => (key === 'WEB_APP_URL' ? 'https://app.example.test/' : undefined),
      } as unknown as ConfigService,
      new LoginAttempts(redis as unknown as Redis),
      new FakeLogger() as unknown as PinoLogger,
    );
  });

  afterAll(async () => {
    await truncate(client.db, tables);
    await client.close();
  });

  it('mails a link, and the link changes the password once', async () => {
    const userId = await makeUser('someone@example.com');

    await service.request({ email: 'Someone@Example.com' });

    expect(outbox).toHaveLength(1);
    expect(outbox[0]!.to).toBe('someone@example.com');
    // The web app's reset page: no doubled slash from the configured address,
    // and the token in the fragment.
    expect(outbox[0]!.text).toContain('https://app.example.test/auth/reset-password#token=');
    const token = tokenFromLastMail();

    expect(await service.check(token)).toBe(true);
    // Locked out from two places before the reset (the lockout is per
    // visitor, so every visitor's count for the address must go).
    redis.values.set('iam:login-attempts:someone@example.com:203.0.113.7', '10');
    redis.values.set('iam:login-attempts:someone@example.com:2001:db8:1:2::/64', '10');
    redis.values.set('iam:login-failures:someone@example.com', '30');
    redis.values.set('iam:login-attempts:other@example.com:203.0.113.7', '10');
    await service.confirm({ token, newPassword: 'a-new-password' });

    expect(await bcrypt.compare('a-new-password', await passwordHashOf(userId))).toBe(true);
    expect(revokeAllForUser).toHaveBeenCalledWith(userId);
    expect([...redis.values.keys()]).toEqual(['iam:login-attempts:other@example.com:203.0.113.7']);

    // Used: it is not good a second time.
    expect(await service.check(token)).toBe(false);
    await expect(
      service.confirm({ token, newPassword: 'another-password' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(await bcrypt.compare('a-new-password', await passwordHashOf(userId))).toBe(true);
  });

  it('keeps only a hash of the token', async () => {
    await makeUser('someone@example.com');
    await service.request({ email: 'someone@example.com' });

    const rows = await client.db.select().from(passwordReset);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(rows[0]!.tokenHash).not.toBe(tokenFromLastMail());
  });

  it('sends nothing for an address with no account, and says nothing', async () => {
    await expect(service.request({ email: 'nobody@example.com' })).resolves.toBeUndefined();
    expect(outbox).toHaveLength(0);
    expect(await client.db.select().from(passwordReset)).toHaveLength(0);
  });

  it('sends nothing to a disabled account', async () => {
    await makeUser('shut@example.com', 'MEMBER', { disabledAt: new Date() });

    await service.request({ email: 'shut@example.com' });

    expect(outbox).toHaveLength(0);
  });

  it('does nothing at all while mail is not set up', async () => {
    await makeUser('someone@example.com');
    mail.isConfigured = false;

    await service.request({ email: 'someone@example.com' });

    expect(outbox).toHaveLength(0);
    expect(await client.db.select().from(passwordReset)).toHaveLength(0);
  });

  it('stops at the daily limit for one account, and starts again a day later', async () => {
    await makeUser('someone@example.com');
    await makeUser('other@example.com');
    const start = new Date('2026-10-13T08:00:00Z');

    for (let i = 0; i < RESET_EMAILS_PER_DAY + 2; i++) {
      await service.request({ email: 'someone@example.com' }, new Date(start.getTime() + i * 1000));
    }
    expect(outbox).toHaveLength(RESET_EMAILS_PER_DAY);

    // The limit is one account's, not everybody's.
    await service.request({ email: 'other@example.com' }, start);
    expect(outbox).toHaveLength(RESET_EMAILS_PER_DAY + 1);
  });

  it('refuses a link older than its hour', async () => {
    const userId = await makeUser('someone@example.com');
    const asked = new Date('2026-10-13T08:00:00Z');
    await service.request({ email: 'someone@example.com' }, asked);
    const token = tokenFromLastMail();

    const justInTime = new Date(asked.getTime() + (RESET_LINK_MINUTES - 1) * 60_000);
    const tooLate = new Date(asked.getTime() + (RESET_LINK_MINUTES + 1) * 60_000);
    expect(await service.check(token, justInTime)).toBe(true);
    expect(await service.check(token, tooLate)).toBe(false);
    await expect(
      service.confirm({ token, newPassword: 'a-new-password' }, tooLate),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(await passwordHashOf(userId)).toBe(OLD_HASH);
  });

  it('closes every other open link when one is used', async () => {
    await makeUser('someone@example.com');
    await service.request({ email: 'someone@example.com' });
    const first = tokenFromLastMail();
    await service.request({ email: 'someone@example.com' });
    const second = tokenFromLastMail();

    await service.confirm({ token: second, newPassword: 'a-new-password' });

    expect(await service.check(first)).toBe(false);
  });

  it('refuses a token nobody was sent', async () => {
    await expect(
      service.confirm({ token: 'x'.repeat(43), newPassword: 'a-new-password' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not let a reset reopen an account disabled after the email went out', async () => {
    const userId = await makeUser('someone@example.com');
    await service.request({ email: 'someone@example.com' });
    await client.db.update(user).set({ disabledAt: new Date() }).where(eq(user.id, userId));

    await expect(
      service.confirm({ token: tokenFromLastMail(), newPassword: 'a-new-password' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(await passwordHashOf(userId)).toBe(OLD_HASH);
  });
});

describe('resetLink', () => {
  it("opens the web app's reset page, with the token in the fragment", () => {
    expect(resetLink('https://app.example.test/', 'tok')).toBe(
      'https://app.example.test/auth/reset-password#token=tok',
    );
  });
});
