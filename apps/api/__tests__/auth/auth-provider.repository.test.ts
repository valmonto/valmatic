import {
  createDatabaseClient,
  eq,
  organization,
  organizationUser,
  user,
  userIdentity,
  type DatabaseClient,
} from '@pkg/database';
import { describeIntegration, truncate } from '@pkg/testing';
import { afterAll, beforeEach, expect, it } from 'vitest';
import { AuthProviderRepository } from '@/auth/provider/auth-provider.repository.js';
import { NO_PASSWORD } from '@/auth/provider/auth-provider.service.js';

/** The writes behind provider sign-in, against a real database. */
describeIntegration('AuthProviderRepository', () => {
  const client: DatabaseClient = createDatabaseClient({ url: process.env.DATABASE_URL! });
  const repository = new AuthProviderRepository(client);
  const tables = [userIdentity, organizationUser, organization, user];
  const HASH = '$2a$04$abcdefghijklmnopqrstuuJ8m1Xo0m4Vq0oQ1m1m1m1m1m1m1m1m1';

  const makeUser = async (email: string, verified: boolean) => {
    const [row] = await client.db
      .insert(user)
      .values({
        email,
        name: email,
        passwordHash: HASH,
        emailVerifiedAt: verified ? new Date() : null,
      })
      .returning();
    return row!.id;
  };
  const userRow = async (id: string) =>
    (await client.db.select().from(user).where(eq(user.id, id)))[0]!;

  beforeEach(async () => truncate(client.db, tables));
  afterAll(async () => {
    await truncate(client.db, tables);
    await client.close();
  });

  it('links a provider to a confirmed account and keeps its password', async () => {
    const id = await makeUser('a@test', true);
    const { claimed } = await repository.linkIdentity({
      userId: id,
      provider: 'google',
      subject: 'g-1',
      email: 'a@test',
      noPassword: NO_PASSWORD,
    });
    expect(claimed).toBe(false);
    expect((await userRow(id)).passwordHash).toBe(HASH);
    expect((await repository.findIdentity('google', 'g-1'))?.user.id).toBe(id);
  });

  it('takes an unconfirmed account: confirmed now, and its password no longer works', async () => {
    const id = await makeUser('b@test', false);
    const { claimed } = await repository.linkIdentity({
      userId: id,
      provider: 'apple',
      subject: 'a-1',
      email: 'b@test',
      noPassword: NO_PASSWORD,
    });
    expect(claimed).toBe(true);
    const row = await userRow(id);
    expect(row.passwordHash).toBe(NO_PASSWORD);
    expect(row.emailVerifiedAt).not.toBeNull();
  });

  it('creates an account that owns an organization of its own, with the link', async () => {
    const created = await repository.createAccount({
      email: 'new@test',
      name: 'New',
      passwordHash: NO_PASSWORD,
      emailVerified: true,
      organizationName: 'New',
      provider: 'google',
      subject: 'g-2',
      providerEmail: 'new@test',
    });
    const [membership] = await client.db
      .select()
      .from(organizationUser)
      .where(eq(organizationUser.userId, created.id));
    expect(membership!.role).toBe('OWNER');
    const [org] = await client.db
      .select()
      .from(organization)
      .where(eq(organization.id, membership!.orgId));
    expect(org!.ownerId).toBe(created.id);
    expect((await repository.findIdentity('google', 'g-2'))?.user.id).toBe(created.id);
  });

  it('lets one Apple account belong to one user only', async () => {
    const one = await makeUser('c@test', true);
    const two = await makeUser('d@test', true);
    const link = (userId: string) =>
      repository.linkIdentity({
        userId,
        provider: 'apple',
        subject: 'same',
        email: null,
        noPassword: NO_PASSWORD,
      });
    await link(one);
    await expect(link(two)).rejects.toThrow();
  });

  it('goes when the account goes', async () => {
    const id = await makeUser('e@test', true);
    await repository.linkIdentity({
      userId: id,
      provider: 'google',
      subject: 'g-3',
      email: null,
      noPassword: NO_PASSWORD,
    });
    await client.db.delete(user).where(eq(user.id, id));
    expect(await repository.findIdentity('google', 'g-3')).toBeNull();
  });
});
