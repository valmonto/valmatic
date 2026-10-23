import { ConflictException, ForbiddenException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import {
  apiKey,
  attachment,
  createDatabaseClient,
  eq,
  notification,
  organization,
  organizationUser,
  user,
  type DatabaseClient,
} from '@pkg/database';
import type { IamService, StorageService } from '@pkg/server';
import { FakeLogger, describeIntegration, truncate } from '@pkg/testing';
import type { PinoLogger } from 'nestjs-pino';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountRepository } from '@/user/account.repository.js';
import { AccountService } from '@/user/account.service.js';

/**
 * Deleting one's own account and downloading one's own data, against a real
 * database: what each organization becomes is decided by foreign keys and
 * cascades, which only Postgres can show.
 */
describeIntegration('AccountService', () => {
  const client: DatabaseClient = createDatabaseClient({ url: process.env.DATABASE_URL! });
  const tables = [apiKey, notification, attachment, organizationUser, organization, user];
  const PASSWORD = 'Correct-horse-1';
  let hash: string;

  let revokeAllForUser: ReturnType<typeof vi.fn>;
  let deleteDirectory: ReturnType<typeof vi.fn>;
  let service: AccountService;

  async function makeUser(email: string): Promise<string> {
    const [row] = await client.db
      .insert(user)
      .values({ email, name: email, passwordHash: hash })
      .returning();
    return row!.id;
  }
  async function makeOrg(name: string, creator: string): Promise<string> {
    const [org] = await client.db
      .insert(organization)
      .values({ name, ownerId: creator })
      .returning();
    await join(org!.id, creator, 'OWNER');
    return org!.id;
  }
  async function join(orgId: string, userId: string, role: 'OWNER' | 'ADMIN' | 'MEMBER') {
    await client.db.insert(organizationUser).values({ orgId, userId, role });
  }
  async function upload(orgId: string, uploadedBy: string): Promise<string> {
    const [row] = await client.db
      .insert(attachment)
      .values({
        orgId,
        subjectType: 'demo',
        subjectId: crypto.randomUUID(),
        kind: 'image',
        bucket: 'b',
        blobId: crypto.randomUUID(),
        fileName: 'proof.png',
        mimeType: 'image/png',
        sizeBytes: 1000,
        uploadedBy,
      })
      .returning();
    return row!.id;
  }
  const exists = async (table: typeof user | typeof organization, id: string) =>
    (await client.db.select().from(table).where(eq(table.id, id))).length > 0;

  beforeEach(async () => {
    await truncate(client.db, tables);
    hash ??= await bcrypt.hash(PASSWORD, 4);
    revokeAllForUser = vi.fn();
    deleteDirectory = vi.fn();
    service = new AccountService(
      new AccountRepository(client),
      { auth: { revokeAllForUser } } as unknown as IamService,
      { deleteDirectory } as unknown as StorageService,
      new FakeLogger() as unknown as PinoLogger,
    );
  });

  afterAll(async () => {
    await truncate(client.db, tables);
    await client.close();
  });

  describe('deleteOwnAccount', () => {
    it('refuses a wrong password and changes nothing', async () => {
      const me = await makeUser('me@test');
      await expect(service.deleteOwnAccount(me, 'wrong')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(await exists(user, me)).toBe(true);
      expect(revokeAllForUser).not.toHaveBeenCalled();
    });

    it('deletes an organization the person is alone in, with its files', async () => {
      const me = await makeUser('me@test');
      const solo = await makeOrg('solo', me);
      await upload(solo, me);

      await service.deleteOwnAccount(me, PASSWORD);

      expect(await exists(user, me)).toBe(false);
      expect(await exists(organization, solo)).toBe(false);
      expect(await client.db.select().from(attachment)).toHaveLength(0);
      expect(deleteDirectory).toHaveBeenCalledWith({ prefix: `org/${solo}/` });
      expect(revokeAllForUser).toHaveBeenCalledWith(me);
    });

    it('refuses while the person is the only owner of an organization with others in it', async () => {
      const me = await makeUser('me@test');
      const other = await makeUser('other@test');
      const shared = await makeOrg('shared', me);
      await join(shared, other, 'ADMIN');

      await expect(service.deleteOwnAccount(me, PASSWORD)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(await exists(user, me)).toBe(true);
    });

    it('hands an organization it created to another owner and keeps the uploads, unattributed', async () => {
      const me = await makeUser('me@test');
      const other = await makeUser('other@test');
      const shared = await makeOrg('shared', me);
      await join(shared, other, 'OWNER');
      const file = await upload(shared, me);

      await service.deleteOwnAccount(me, PASSWORD);

      const [org] = await client.db.select().from(organization).where(eq(organization.id, shared));
      expect(org!.ownerId).toBe(other);
      const [row] = await client.db.select().from(attachment).where(eq(attachment.id, file));
      expect(row!.uploadedBy).toBeNull();
      expect(deleteDirectory).not.toHaveBeenCalled();
    });

    it('a member simply leaves', async () => {
      const owner = await makeUser('owner@test');
      const me = await makeUser('me@test');
      const org = await makeOrg('theirs', owner);
      await join(org, me, 'MEMBER');

      await service.deleteOwnAccount(me, PASSWORD);

      expect(await exists(user, me)).toBe(false);
      expect(await exists(organization, org)).toBe(true);
      expect(await exists(user, owner)).toBe(true);
    });
  });

  describe('exportOwnData', () => {
    it("holds the person's data and no secret", async () => {
      const me = await makeUser('me@test');
      const org = await makeOrg('mine', me);
      await upload(org, me);
      await client.db.insert(notification).values({ userId: me, orgId: org, title: 'Hello' });
      await client.db.insert(apiKey).values({
        name: 'ci',
        prefix: 'vk_abc',
        hashedKey: 'f'.repeat(64),
        scopes: ['read'],
        userId: me,
      });

      const data = await service.exportOwnData(me);

      expect(data.account.email).toBe('me@test');
      expect(data.organizations).toEqual([
        expect.objectContaining({ id: org, name: 'mine', role: 'OWNER' }),
      ]);
      expect(data.notifications.map((n) => n.title)).toEqual(['Hello']);
      expect(data.attachments).toHaveLength(1);
      expect(data.apiKeys.map((a) => a.prefix)).toEqual(['vk_abc']);
      const text = JSON.stringify(data);
      expect(text).not.toContain(hash);
      expect(text).not.toContain('f'.repeat(64));
    });
  });
});
