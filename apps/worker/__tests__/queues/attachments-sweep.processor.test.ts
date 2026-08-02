import {
  createDatabaseClient,
  attachment,
  eq,
  organization,
  organizationUser,
  user,
  type DatabaseClient,
} from '@pkg/database';
import type { StorageService } from '@pkg/server';
import { FakeLogger, describeIntegration, truncate } from '@pkg/testing';
import type { Queue, Job } from 'bullmq';
import type { PinoLogger } from 'nestjs-pino';
import { afterAll, beforeEach, expect, it, vi } from 'vitest';
import { AttachmentsSweepProcessor } from '@/queues/attachments-sweep/attachments-sweep.processor';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/**
 * The storage GC's three predicates (docs/storage.md), each against real SQL:
 * stale pendings are purged, expiries are soft-deleted, aged soft-deletes are
 * hard-deleted — and rows matching none of them are left alone.
 */
describeIntegration('AttachmentsSweepProcessor', () => {
  const client: DatabaseClient = createDatabaseClient({ url: process.env.DATABASE_URL! });
  const deletedKeys: string[] = [];
  const storage = {
    deleteFile: vi.fn().mockImplementation(async ({ key }: { key: string }) => {
      deletedKeys.push(key);
    }),
  } as unknown as StorageService;
  const queue = { upsertJobScheduler: vi.fn() } as unknown as Queue;
  const processor = new AttachmentsSweepProcessor(
    client,
    storage,
    queue,
    new FakeLogger().as<PinoLogger>(),
  );

  let orgId: string;
  let userId: string;

  const insertRow = async (
    overrides: Partial<typeof attachment.$inferInsert> = {},
  ): Promise<typeof attachment.$inferSelect> => {
    const [row] = await client.db
      .insert(attachment)
      .values({
        orgId,
        subjectType: 'demo',
        subjectId: '33333333-3333-4333-8333-333333333333',
        kind: 'image',
        bucket: 'valmatic-attachments',
        blobId: crypto.randomUUID(),
        mimeType: 'image/png',
        sizeBytes: 1000,
        uploadedBy: userId,
        ...overrides,
      })
      .returning();
    return row!;
  };

  const find = async (id: string): Promise<typeof attachment.$inferSelect | null> => {
    const [row] = await client.db.select().from(attachment).where(eq(attachment.id, id)).limit(1);
    return row ?? null;
  };

  beforeEach(async () => {
    deletedKeys.length = 0;
    vi.clearAllMocks();
    await truncate(client.db, [attachment, organizationUser, organization, user]);

    const [owner] = await client.db
      .insert(user)
      .values({ email: 'sweep-owner@example.com', name: 'Sweep Owner', passwordHash: 'x' })
      .returning();
    userId = owner!.id;
    const [org] = await client.db
      .insert(organization)
      .values({ name: 'sweep-org', ownerId: userId })
      .returning();
    orgId = org!.id;
    await client.db.insert(organizationUser).values({ orgId, userId, role: 'OWNER' });
  });

  afterAll(async () => {
    await truncate(client.db, [attachment, organizationUser, organization, user]);
    await client.close();
  });

  it('purges pendings older than 24h — row and object both gone', async () => {
    const stale = await insertRow({ createdAt: new Date(Date.now() - 25 * HOUR_MS) });
    const fresh = await insertRow({ createdAt: new Date(Date.now() - 1 * HOUR_MS) });

    const result = await processor.process({} as Job);

    expect(result.pending).toBe(1);
    await expect(find(stale.id)).resolves.toBeNull();
    await expect(find(fresh.id)).resolves.toMatchObject({ id: fresh.id, status: 'pending' });
    expect(deletedKeys).toEqual([`org/${orgId}/demo/${stale.subjectId}/${stale.blobId}`]);
  });

  it('soft-deletes uploaded rows past their expiry and deletes their objects', async () => {
    const expired = await insertRow({
      status: 'uploaded',
      expiresAt: new Date(Date.now() - HOUR_MS),
    });
    const alive = await insertRow({
      status: 'uploaded',
      expiresAt: new Date(Date.now() + DAY_MS),
    });
    const forever = await insertRow({ status: 'uploaded' });

    const result = await processor.process({} as Job);

    expect(result.expired).toBe(1);
    const swept = await find(expired.id);
    expect(swept?.deletedAt).not.toBeNull();
    await expect(find(alive.id)).resolves.toMatchObject({ deletedAt: null });
    await expect(find(forever.id)).resolves.toMatchObject({ deletedAt: null });
    expect(deletedKeys).toContain(`org/${orgId}/demo/${expired.subjectId}/${expired.blobId}`);
  });

  it('hard-deletes rows soft-deleted more than 7 days ago (thumbnail object included)', async () => {
    const thumbId = crypto.randomUUID();
    const old = await insertRow({
      status: 'uploaded',
      thumbnailBlobId: thumbId,
      deletedAt: new Date(Date.now() - 8 * DAY_MS),
    });
    const recent = await insertRow({
      status: 'uploaded',
      deletedAt: new Date(Date.now() - 1 * DAY_MS),
    });

    const result = await processor.process({} as Job);

    expect(result.purged).toBe(1);
    await expect(find(old.id)).resolves.toBeNull();
    await expect(find(recent.id)).resolves.toMatchObject({ id: recent.id });
    expect(deletedKeys).toContain(`org/${orgId}/demo/${old.subjectId}/${old.blobId}`);
    expect(deletedKeys).toContain(`org/${orgId}/demo/${old.subjectId}/${thumbId}`);
  });

  it('is idempotent — a second sweep over the same state does nothing', async () => {
    await insertRow({ createdAt: new Date(Date.now() - 25 * HOUR_MS) });
    await insertRow({ status: 'uploaded', expiresAt: new Date(Date.now() - HOUR_MS) });

    await processor.process({} as Job);
    const second = await processor.process({} as Job);

    expect(second).toEqual({ pending: 0, expired: 0, purged: 0 });
  });

  it('a storage failure does not wedge the sweep — the row work still happens', async () => {
    (storage.deleteFile as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('storage down'),
    );
    const stale = await insertRow({ createdAt: new Date(Date.now() - 25 * HOUR_MS) });

    const result = await processor.process({} as Job);

    expect(result.pending).toBe(1);
    await expect(find(stale.id)).resolves.toBeNull();
  });
});
