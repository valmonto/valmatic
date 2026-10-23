import {
  createDatabaseClient,
  emailVerification,
  eq,
  user,
  type DatabaseClient,
} from '@pkg/database';
import { describeIntegration, truncate } from '@pkg/testing';
import { afterAll, beforeEach, expect, it } from 'vitest';
import { EmailVerificationRepository } from '@/auth/email-verification/email-verification.repository.js';

const HOUR = 60 * 60 * 1000;

/**
 * Confirm-your-address links against real SQL: a link confirms the address
 * it was mailed to and nothing else, works once, and an unconfirmed address
 * can be corrected — but never onto somebody else's, and never once confirmed.
 */
describeIntegration('EmailVerificationRepository', () => {
  const client: DatabaseClient = createDatabaseClient({ url: process.env.DATABASE_URL! });
  const repository = new EmailVerificationRepository(client);
  const tables = [emailVerification, user];
  const now = new Date('2026-10-14T12:00:00Z');

  let alice: string;
  let bob: string;

  const make = async (email: string) => {
    const [row] = await client.db
      .insert(user)
      .values({ email, name: email, passwordHash: 'secret-hash' })
      .returning();
    return row!.id;
  };
  const link = (
    userId: string,
    email: string,
    tokenHash: string,
    expiresAt = new Date(now.getTime() + HOUR),
  ) => repository.create({ userId, email, tokenHash, expiresAt, forgetBefore: new Date(0) });
  const account = async (id: string) =>
    (await client.db.select().from(user).where(eq(user.id, id)))[0]!;

  beforeEach(async () => {
    await truncate(client.db, tables);
    alice = await make('alice@example.com');
    bob = await make('bob@example.com');
  });

  afterAll(async () => {
    await truncate(client.db, tables);
    await client.close();
  });

  it('confirms the address a link was mailed to, once', async () => {
    await link(alice, 'alice@example.com', 'a'.repeat(64));

    expect(await repository.consume('a'.repeat(64), now)).toBe('alice@example.com');
    expect((await account(alice)).emailVerifiedAt).toEqual(now);
    // The same link again does nothing.
    expect(await repository.consume('a'.repeat(64), now)).toBeNull();
    // And nobody else was touched.
    expect((await account(bob)).emailVerifiedAt).toBeNull();
  });

  it('refuses a link that is too old', async () => {
    await link(alice, 'alice@example.com', 'b'.repeat(64), new Date(now.getTime() - 1));
    expect(await repository.consume('b'.repeat(64), now)).toBeNull();
    expect((await account(alice)).emailVerifiedAt).toBeNull();
  });

  it('lets an unconfirmed address be corrected, and the old link then confirms nothing', async () => {
    await link(alice, 'alice@example.com', 'c'.repeat(64));

    expect(await repository.changeUnverified(alice, 'alice@example.org', now)).toBe(true);
    expect((await account(alice)).email).toBe('alice@example.org');
    // The link went to the OLD address: it must not confirm the new one.
    expect(await repository.consume('c'.repeat(64), now)).toBeNull();
    expect((await account(alice)).emailVerifiedAt).toBeNull();
  });

  it('never moves an address onto one another account holds, whatever its case', async () => {
    expect(await repository.changeUnverified(alice, 'BOB@example.com', now)).toBe(false);
    expect((await account(alice)).email).toBe('alice@example.com');
  });

  it('never changes a confirmed address', async () => {
    await link(alice, 'alice@example.com', 'd'.repeat(64));
    await repository.consume('d'.repeat(64), now);

    expect(await repository.changeUnverified(alice, 'other@example.com', now)).toBe(false);
    expect((await account(alice)).email).toBe('alice@example.com');
  });

  it('counts the links an account was mailed, for the daily limit', async () => {
    await link(alice, 'alice@example.com', 'e'.repeat(64));
    await link(alice, 'alice@example.com', 'f'.repeat(64));
    await link(bob, 'bob@example.com', '0'.repeat(64));
    expect(await repository.countSince(alice, new Date(0))).toBe(2);
  });
});
