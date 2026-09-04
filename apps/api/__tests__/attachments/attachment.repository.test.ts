import {
  createDatabaseClient,
  attachment,
  organization,
  organizationUser,
  user,
  type DatabaseClient,
} from '@pkg/database';
import type { ActiveUser } from '@pkg/contracts';
import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { FakeLogger, describeIntegration, truncate } from '@pkg/testing';
import type { PinoLogger } from 'nestjs-pino';
import { afterAll, beforeEach, expect, it, vi } from 'vitest';
import { AttachmentRepository } from '@/attachments/attachment.repository';
import { AttachmentsService } from '@/attachments/attachments.service';
import type { StorageService } from '@pkg/server';

/**
 * The service tests assert the repository is *called* with the right ids; only
 * a real database shows the queries actually scope by them. Attachments are
 * exactly the kind of table where a missed orgId join leaks one tenant's
 * files into another's list.
 */
describeIntegration('AttachmentRepository', () => {
  const client: DatabaseClient = createDatabaseClient({ url: process.env.DATABASE_URL! });
  const repository = new AttachmentRepository(client);

  let orgA: string;
  let orgB: string;
  let ownerA: string;
  let ownerB: string;
  const subjectId = '33333333-3333-4333-8333-333333333333';

  async function makeOrg(name: string): Promise<{ orgId: string; ownerId: string }> {
    const [owner] = await client.db
      .insert(user)
      .values({ email: `${name}-owner@example.com`, name: `${name} owner`, passwordHash: 'x' })
      .returning();

    const [org] = await client.db
      .insert(organization)
      .values({ name, ownerId: owner!.id })
      .returning();

    await client.db
      .insert(organizationUser)
      .values({ orgId: org!.id, userId: owner!.id, role: 'OWNER' });

    return { orgId: org!.id, ownerId: owner!.id };
  }

  const insertAttachment = (
    orgId: string,
    uploadedBy: string,
    overrides = {},
  ): ReturnType<AttachmentRepository['insert']> =>
    repository.insert({
      orgId,
      subjectType: 'demo',
      subjectId,
      kind: 'image',
      bucket: 'valmatic-attachments',
      blobId: crypto.randomUUID(),
      fileName: 'proof.png',
      mimeType: 'image/png',
      sizeBytes: 1000,
      uploadedBy,
      ...overrides,
    });

  beforeEach(async () => {
    await truncate(client.db, [attachment, organizationUser, organization, user]);

    const a = await makeOrg('att-org-a');
    const b = await makeOrg('att-org-b');
    orgA = a.orgId;
    orgB = b.orgId;
    ownerA = a.ownerId;
    ownerB = b.ownerId;
  });

  afterAll(async () => {
    await truncate(client.db, [attachment, organizationUser, organization, user]);
    await client.close();
  });

  // --- The tenancy wall ---

  it('findById returns null for another org’s attachment — indistinguishable from missing', async () => {
    const theirs = await insertAttachment(orgB, ownerB);

    await expect(repository.findById(theirs.id, orgA)).resolves.toBeNull();
    await expect(repository.findById(theirs.id, orgB)).resolves.toMatchObject({ id: theirs.id });
  });

  it('confirm cannot flip another org’s pending row', async () => {
    const theirs = await insertAttachment(orgB, ownerB);

    const crossTenant = await repository.confirm(theirs.id, orgA, {
      sizeBytes: 999,
      thumbnailBlobId: null,
    });
    expect(crossTenant).toBeNull();

    const untouched = await repository.findById(theirs.id, orgB);
    expect(untouched?.status).toBe('pending');
  });

  it('softDelete and hardDelete stop at the org boundary', async () => {
    const theirs = await insertAttachment(orgB, ownerB);

    await expect(repository.softDelete(theirs.id, orgA)).resolves.toBe(false);
    await repository.hardDelete(theirs.id, orgA);
    await expect(repository.findById(theirs.id, orgB)).resolves.toMatchObject({ id: theirs.id });
  });

  it('lists only the caller org’s uploaded attachments for a subject', async () => {
    const mine = await insertAttachment(orgA, ownerA);
    await repository.confirm(mine.id, orgA, { sizeBytes: 1000, thumbnailBlobId: null });
    // Same subjectId in the other org — polymorphic ids do not namespace by
    // themselves; the orgId column is the wall.
    const theirs = await insertAttachment(orgB, ownerB);
    await repository.confirm(theirs.id, orgB, { sizeBytes: 1000, thumbnailBlobId: null });
    // A pending row in my org must stay invisible too.
    await insertAttachment(orgA, ownerA);

    const listed = await repository.listUploadedBySubject(orgA, 'demo', subjectId);
    expect(listed.map((row) => row.id)).toEqual([mine.id]);
  });

  it('confirm is a compare-and-swap: the second confirm updates nothing', async () => {
    const mine = await insertAttachment(orgA, ownerA);
    const first = await repository.confirm(mine.id, orgA, {
      sizeBytes: 977,
      thumbnailBlobId: null,
    });
    expect(first?.status).toBe('uploaded');

    const second = await repository.confirm(mine.id, orgA, { sizeBytes: 1, thumbnailBlobId: null });
    expect(second).toBeNull();
    await expect(repository.findById(mine.id, orgA)).resolves.toMatchObject({ sizeBytes: 977 });
  });

  // --- The three-step protocol against real SQL (storage stubbed) ---

  const activeUser = (): ActiveUser => ({
    userId: ownerA,
    orgId: orgA,
    orgRole: 'OWNER',
    systemRole: 'USER',
  });

  const stubStorage = (headSize: number | null): StorageService =>
    ({
      ensureBucket: vi.fn().mockResolvedValue(undefined),
      configureBucketCors: vi.fn().mockResolvedValue(undefined),
      createSignedUploadUrl: vi.fn().mockImplementation(async ({ key }: { key: string }) => ({
        bucket: 'valmatic-attachments',
        key,
        url: `https://storage/put/${key}`,
      })),
      createSignedReadUrl: vi.fn().mockImplementation(async ({ key }: { key: string }) => ({
        bucket: 'valmatic-attachments',
        key,
        url: `https://storage/get/${key}`,
      })),
      headObject: vi
        .fn()
        .mockResolvedValue(
          headSize === null ? null : { contentLength: headSize, contentType: 'image/png' },
        ),
      deleteFile: vi.fn().mockResolvedValue(undefined),
      deleteDirectory: vi.fn().mockResolvedValue(undefined),
    }) as unknown as StorageService;

  const makeService = (storage: StorageService): AttachmentsService =>
    new AttachmentsService(
      storage,
      repository,
      { demo: async (): Promise<boolean> => true },
      new FakeLogger().as<PinoLogger>(),
    );

  it('declare → PUT → confirm: the row becomes listable only after confirm', async () => {
    const service = makeService(stubStorage(1000));

    const declared = await service.createUpload(activeUser(), {
      subjectType: 'demo',
      subjectId,
      kind: 'image',
      fileName: 'proof.png',
      mimeType: 'image/png',
      sizeBytes: 1000,
      withThumbnail: false,
    });
    expect(declared.uploadUrl).toContain(`org/${orgA}/demo/${subjectId}/`);

    // Pending: invisible to readers.
    const before = await service.list(activeUser(), { subjectType: 'demo', subjectId });
    expect(before.data).toEqual([]);

    // (the client PUTs the bytes here — storage is stubbed)
    const confirmed = await service.confirm(activeUser(), { id: declared.attachment.id });
    expect(confirmed.status).toBe('uploaded');

    const after = await service.list(activeUser(), { subjectType: 'demo', subjectId });
    expect(after.data.map((item) => item.attachment.id)).toEqual([declared.attachment.id]);
  });

  it('confirm rejects a size mismatch and removes row + object', async () => {
    // Declared 1000 bytes; the store reports 8 MB — over declared*1.1+4096.
    const storage = stubStorage(8 * 1024 * 1024);
    const service = makeService(storage);

    const declared = await service.createUpload(activeUser(), {
      subjectType: 'demo',
      subjectId,
      kind: 'image',
      mimeType: 'image/png',
      sizeBytes: 1000,
      withThumbnail: false,
    });

    await expect(service.confirm(activeUser(), { id: declared.attachment.id })).rejects.toThrow(
      UnprocessableEntityException,
    );
    expect(storage.deleteFile).toHaveBeenCalled();
    // The lying declaration's row is gone entirely, not soft-deleted.
    await expect(repository.findById(declared.attachment.id, orgA)).resolves.toBeNull();
  });

  it('an org B attachment does not exist for org A even through the service', async () => {
    const service = makeService(stubStorage(1000));
    const theirs = await insertAttachment(orgB, ownerB);

    await expect(service.confirm(activeUser(), { id: theirs.id })).rejects.toThrow(
      NotFoundException,
    );
  });
});
