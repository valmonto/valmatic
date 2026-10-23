import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ATTACHMENT_POLICIES, type ActiveUser } from '@pkg/contracts';
import { FakeLogger } from '@pkg/testing';
import type { PinoLogger } from 'nestjs-pino';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AttachmentsService } from '@/attachments/attachments.service.js';
import type { AttachmentRepository } from '@/attachments/attachment.repository.js';
import type { StorageService } from '@pkg/server';

const ORG = '11111111-1111-4111-8111-111111111111';
const USER = '22222222-2222-4222-8222-222222222222';
const SUBJECT = '33333333-3333-4333-8333-333333333333';
const ATT = '44444444-4444-4444-8444-444444444444';
const now = new Date('2026-01-01T00:00:00.000Z');

const human: ActiveUser = { userId: USER, orgId: ORG, orgRole: 'OWNER', systemRole: 'USER' };
const OTHER = '66666666-6666-4666-8666-666666666666';
const member: ActiveUser = { userId: OTHER, orgId: ORG, orgRole: 'MEMBER', systemRole: 'USER' };

const pendingRow = {
  id: ATT,
  orgId: ORG,
  // The module is domain-blind: 'task' here is just whatever subject type the
  // composition root registered a resolver for — the tests play the app.
  subjectType: 'task',
  subjectId: SUBJECT,
  kind: 'image',
  status: 'pending',
  bucket: 'valmatic-attachments',
  blobId: '55555555-5555-4555-8555-555555555555',
  thumbnailBlobId: null,
  fileName: 'proof.png',
  mimeType: 'image/png',
  sizeBytes: 1000,
  waveform: null,
  uploadedBy: USER,
  expiresAt: null,
  createdAt: now,
  deletedAt: null,
};

describe('AttachmentsService — the three-step protocol', () => {
  let service: AttachmentsService;
  let repo: Record<string, ReturnType<typeof vi.fn>>;
  let storage: Record<string, ReturnType<typeof vi.fn>>;
  let taskExists: ReturnType<typeof vi.fn>;

  const row = (overrides: Record<string, unknown>): Record<string, unknown> => ({
    ...pendingRow,
    ...overrides,
  });

  beforeEach(() => {
    repo = {
      insert: vi
        .fn()
        .mockImplementation(async (data) => ({ ...pendingRow, ...data, id: ATT, createdAt: now })),
      findById: vi.fn().mockResolvedValue(pendingRow),
      listUploadedBySubject: vi.fn().mockResolvedValue([]),
      confirm: vi
        .fn()
        .mockImplementation(async (_id, _org, patch) => row({ status: 'uploaded', ...patch })),
      softDelete: vi.fn().mockResolvedValue(true),
      hardDelete: vi.fn().mockResolvedValue(undefined),
    };
    storage = {
      ensureBucket: vi.fn().mockResolvedValue(undefined),
      configureBucketCors: vi.fn().mockResolvedValue(undefined),
      createSignedUploadUrl: vi.fn().mockImplementation(async ({ key }) => ({
        bucket: 'valmatic-attachments',
        key,
        url: `https://storage/put/${key}`,
      })),
      createSignedReadUrl: vi.fn().mockImplementation(async ({ key }) => ({
        bucket: 'valmatic-attachments',
        key,
        url: `https://storage/get/${key}`,
      })),
      headObject: vi.fn().mockResolvedValue({ contentLength: 1000, contentType: 'image/png' }),
      deleteFile: vi.fn().mockResolvedValue(undefined),
      deleteDirectory: vi.fn().mockResolvedValue(undefined),
    };
    taskExists = vi.fn().mockResolvedValue(true);
    service = new AttachmentsService(
      storage as unknown as StorageService,
      repo as unknown as AttachmentRepository,
      { task: taskExists as unknown as (subjectId: string, orgId: string) => Promise<boolean> },
      new FakeLogger().as<PinoLogger>(),
    );
  });

  // --- Declare ---

  it('declares an upload: pending row + presigned PUT under the org/subject key', async () => {
    const result = await service.createUpload(human, {
      subjectType: 'task',
      subjectId: SUBJECT,
      kind: 'image',
      mimeType: 'image/png',
      sizeBytes: 1000,
      withThumbnail: false,
    });

    expect(taskExists).toHaveBeenCalledWith(SUBJECT, ORG);
    expect(result.uploadUrl).toContain(`org/${ORG}/task/${SUBJECT}/`);
    expect(repo.insert).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: ORG, kind: 'image' }),
    );
  });

  it('rejects a subject that does not exist in the org', async () => {
    taskExists.mockResolvedValue(false);
    await expect(
      service.createUpload(human, {
        subjectType: 'task',
        subjectId: SUBJECT,
        kind: 'image',
        mimeType: 'image/png',
        sizeBytes: 1000,
        withThumbnail: false,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects an unregistered subject type — the resolver map IS the allowlist', async () => {
    await expect(
      service.createUpload(human, {
        subjectType: 'invoice',
        subjectId: SUBJECT,
        kind: 'image',
        mimeType: 'image/png',
        sizeBytes: 1000,
        withThumbnail: false,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a declaration over the kind ceiling before any upload happens', async () => {
    await expect(
      service.createUpload(human, {
        subjectType: 'task',
        subjectId: SUBJECT,
        kind: 'image',
        mimeType: 'image/png',
        sizeBytes: 11 * 1024 * 1024,
        withThumbnail: false,
      }),
    ).rejects.toThrow(UnprocessableEntityException);
    expect(repo.insert).not.toHaveBeenCalled();
  });

  it('accepts every kind when the subject has no policy (template default)', async () => {
    const result = await service.createUpload(human, {
      subjectType: 'task',
      subjectId: SUBJECT,
      kind: 'video',
      mimeType: 'video/mp4',
      sizeBytes: 1000,
      withThumbnail: false,
    });
    expect(result.attachment.kind).toBe('video');
  });

  // --- Confirm: the truth step ---

  it('confirms with the HEAD-verified size, not the declared one', async () => {
    storage.headObject!.mockResolvedValue({ contentLength: 987 });
    const result = await service.confirm(human, { id: ATT });

    expect(repo.confirm).toHaveBeenCalledWith(
      ATT,
      ORG,
      expect.objectContaining({ sizeBytes: 987 }),
    );
    expect(result.status).toBe('uploaded');
  });

  it('422s when the object was never uploaded — row survives for a retry', async () => {
    storage.headObject!.mockResolvedValue(null);
    await expect(service.confirm(human, { id: ATT })).rejects.toThrow(UnprocessableEntityException);
    expect(repo.hardDelete).not.toHaveBeenCalled();
  });

  it('deletes object and row when the upload exceeds the platform ceiling', async () => {
    // 50 MB against the 10 MB image cap: the declaration lied.
    storage.headObject!.mockResolvedValue({ contentLength: 50 * 1024 * 1024 });
    await expect(service.confirm(human, { id: ATT })).rejects.toThrow(UnprocessableEntityException);
    expect(storage.deleteFile).toHaveBeenCalled();
    expect(repo.hardDelete).toHaveBeenCalledWith(ATT, ORG);
  });

  it('confirm is idempotent — an already-uploaded row returns as-is', async () => {
    repo.findById!.mockResolvedValue(row({ status: 'uploaded' }));
    const result = await service.confirm(human, { id: ATT });
    expect(result.status).toBe('uploaded');
    expect(storage.headObject).not.toHaveBeenCalled();
  });

  it('drops a promised-but-missing thumbnail instead of failing the confirm', async () => {
    repo.findById!.mockResolvedValue(
      row({ thumbnailBlobId: '66666666-6666-4666-8666-666666666666' }),
    );
    storage.headObject!.mockResolvedValueOnce({ contentLength: 1000 }).mockResolvedValueOnce(null);
    await service.confirm(human, { id: ATT });
    expect(repo.confirm).toHaveBeenCalledWith(
      ATT,
      ORG,
      expect.objectContaining({ thumbnailBlobId: null }),
    );
  });

  it('refuses a declared type outside the subject policy allowlist', async () => {
    const policies = ATTACHMENT_POLICIES as Record<string, unknown>;
    policies.task = { kinds: ['image'], mimeTypes: ['image/png', 'image/jpeg'] };
    try {
      await expect(
        service.createUpload(human, {
          subjectType: 'task',
          subjectId: SUBJECT,
          kind: 'image',
          mimeType: 'image/svg+xml',
          sizeBytes: 1000,
          withThumbnail: false,
        }),
      ).rejects.toThrow(UnprocessableEntityException);
      expect(repo.insert).not.toHaveBeenCalled();
    } finally {
      delete policies.task;
    }
  });

  // --- Reads ---

  it('sends a raster image inline, with its own type', async () => {
    repo.findById!.mockResolvedValue(row({ status: 'uploaded' }));
    await service.readUrl(human, { id: ATT });
    expect(storage.createSignedReadUrl).toHaveBeenCalledWith(
      expect.objectContaining({ filename: 'proof.png', responseContentType: 'image/png' }),
    );
  });

  // An uploaded SVG or HTML file opened from its signed URL would run its
  // script on the storage origin.
  it('sends a type that can run script as a download, never inline', async () => {
    repo.findById!.mockResolvedValue(
      row({ status: 'uploaded', mimeType: 'image/svg+xml', fileName: null }),
    );
    await service.readUrl(human, { id: ATT });
    expect(storage.createSignedReadUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: 'download',
        responseContentType: 'application/octet-stream',
      }),
    );
  });

  it('read-url refuses pending attachments — readers only ever see uploaded', async () => {
    await expect(service.readUrl(human, { id: ATT })).rejects.toThrow(NotFoundException);
  });

  it('an attachment outside the org is indistinguishable from a missing one', async () => {
    repo.findById!.mockResolvedValue(null);
    await expect(service.readUrl(human, { id: ATT })).rejects.toThrow(NotFoundException);
  });

  // --- Delete ---

  it('lets a member delete their own upload', async () => {
    repo.findById!.mockResolvedValue(row({ status: 'uploaded', uploadedBy: OTHER }));
    await service.delete(member, { id: ATT });
    expect(repo.softDelete).toHaveBeenCalledWith(ATT, ORG);
  });

  it("refuses a member deleting someone else's upload, and deletes nothing", async () => {
    repo.findById!.mockResolvedValue(row({ status: 'uploaded' }));
    await expect(service.delete(member, { id: ATT })).rejects.toThrow(ForbiddenException);
    expect(storage.deleteFile).not.toHaveBeenCalled();
    expect(repo.softDelete).not.toHaveBeenCalled();
  });

  it("lets an admin or owner delete anyone's upload", async () => {
    repo.findById!.mockResolvedValue(row({ status: 'uploaded', uploadedBy: OTHER }));
    await service.delete({ ...human, orgRole: 'ADMIN' }, { id: ATT });
    await service.delete(human, { id: ATT });
    expect(repo.softDelete).toHaveBeenCalledTimes(2);
  });

  // --- Subject cleanup ---

  it('deleteSubjectPrefix removes the whole org/subject prefix in one call', async () => {
    await service.deleteSubjectPrefix(ORG, 'task', SUBJECT);
    expect(storage.deleteDirectory).toHaveBeenCalledWith({
      prefix: `org/${ORG}/task/${SUBJECT}/`,
    });
  });

  // --- Bucket init resilience (the servicebook bug, fixed) ---

  it('retries bucket init after a failure instead of caching the rejection', async () => {
    storage
      .ensureBucket!.mockRejectedValueOnce(new Error('boot blip'))
      .mockResolvedValue(undefined);
    const dto = {
      subjectType: 'task',
      subjectId: SUBJECT,
      kind: 'image' as const,
      mimeType: 'image/png',
      sizeBytes: 1000,
      withThumbnail: false,
    };

    await expect(service.createUpload(human, dto)).rejects.toThrow('boot blip');
    await expect(service.createUpload(human, dto)).resolves.toBeTruthy();
  });
});
