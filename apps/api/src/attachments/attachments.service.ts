import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { InjectLogger, PinoLogger, StorageService } from '@pkg/server';
import {
  attachmentKindAllowed,
  attachmentLimitFor,
  type ActiveUser,
  type Attachment,
  type AttachmentWithUrls,
  type ConfirmAttachmentRequest,
  type CreateAttachmentUploadRequest,
  type CreateAttachmentUploadResponse,
  type DeleteAttachmentRequest,
  type GetAttachmentReadUrlRequest,
  type ListAttachmentsRequest,
  type ListAttachmentsResponse,
} from '@pkg/contracts';
import type { AttachmentRow } from '@pkg/database';
import { k } from '@pkg/locales';
import { AttachmentRepository } from './attachment.repository.js';
import { ATTACHMENT_SUBJECT_RESOLVERS, type SubjectResolvers } from './attachment.tokens.js';

/**
 * The three-step upload protocol (docs/storage.md): declare → client PUTs
 * against a presigned URL → confirm. Rows are born `pending` and flip to
 * `uploaded` only after the server HEAD-verifies what actually landed in the
 * store; readers serve `uploaded` only, so a closed tab leaves nothing
 * visible — just a pending row the sweep purges.
 */
@Injectable()
export class AttachmentsService {
  private bucketReady?: Promise<void>;

  constructor(
    private readonly storage: StorageService,
    private readonly repository: AttachmentRepository,
    @Inject(ATTACHMENT_SUBJECT_RESOLVERS) private readonly subjects: SubjectResolvers,
    @InjectLogger() private readonly logger: PinoLogger,
  ) {}

  async createUpload(
    activeUser: ActiveUser,
    dto: CreateAttachmentUploadRequest,
  ): Promise<CreateAttachmentUploadResponse> {
    await this.requireSubject(dto.subjectType, dto.subjectId, activeUser.orgId);

    // Subject policy: which kinds this subject accepts at all.
    if (!attachmentKindAllowed(dto.subjectType, dto.kind)) {
      throw new UnprocessableEntityException(k.attachments.errors.kindNotAllowed);
    }

    // The declared size is a claim (verified at confirm), but an honest
    // client declaring over the effective ceiling (min of platform cap and
    // subject policy) should fail before uploading a byte.
    if (dto.sizeBytes > attachmentLimitFor(dto.subjectType, dto.kind)) {
      throw new UnprocessableEntityException(k.attachments.errors.tooLarge);
    }

    await this.ensureBucket();

    const blobId = randomUUID();
    const thumbnailBlobId = dto.withThumbnail ? randomUUID() : null;
    const keyOf = (blob: string): string =>
      `org/${activeUser.orgId}/${dto.subjectType}/${dto.subjectId}/${blob}`;

    const [signed, thumbnailSigned] = await Promise.all([
      this.storage.createSignedUploadUrl({ key: keyOf(blobId), contentType: dto.mimeType }),
      thumbnailBlobId
        ? this.storage.createSignedUploadUrl({
            key: keyOf(thumbnailBlobId),
            contentType: 'image/jpeg',
          })
        : Promise.resolve(null),
    ]);

    const row = await this.repository.insert({
      orgId: activeUser.orgId,
      subjectType: dto.subjectType,
      subjectId: dto.subjectId,
      kind: dto.kind,
      bucket: signed.bucket,
      blobId,
      thumbnailBlobId,
      fileName: dto.fileName ?? null,
      mimeType: dto.mimeType,
      sizeBytes: dto.sizeBytes,
      waveform: dto.waveform ?? null,
      uploadedBy: activeUser.userId,
    });

    return {
      attachment: this.serialize(row),
      uploadUrl: signed.url,
      thumbnailUploadUrl: thumbnailSigned?.url ?? null,
    };
  }

  /**
   * The truth step: HEAD what actually landed. Missing object → the client
   * never uploaded (or is confirming too early) — 422, row stays pending for
   * a retry or the sweep. Size over the declared value or the kind ceiling →
   * the declaration lied — object and row are deleted, the confirm fails.
   */
  async confirm(activeUser: ActiveUser, dto: ConfirmAttachmentRequest): Promise<Attachment> {
    const row = await this.repository.findById(dto.id, activeUser.orgId);
    if (!row) throw new NotFoundException(k.attachments.errors.notFound);
    if (row.status === 'uploaded') return this.serialize(row);

    const head = await this.storage.headObject({ bucket: row.bucket, key: this.keyOf(row) });
    if (!head) {
      throw new UnprocessableEntityException(k.attachments.errors.notUploaded);
    }

    // Same effective ceiling the declare used — recomputed from the row so a
    // policy change between declare and confirm still applies.
    const ceiling = attachmentLimitFor(row.subjectType, row.kind as Attachment['kind']);
    if (head.contentLength > ceiling || head.contentLength > row.sizeBytes * 1.1 + 4096) {
      await this.storage.deleteFile({ bucket: row.bucket, key: this.keyOf(row) });
      await this.repository.hardDelete(row.id, activeUser.orgId);
      this.logger.warn(
        { attachmentId: row.id, declared: row.sizeBytes, actual: head.contentLength },
        'Attachment size mismatch — object and row removed',
      );
      throw new UnprocessableEntityException(k.attachments.errors.sizeMismatch);
    }

    // The thumbnail is optional garnish: missing means the client skipped it.
    let thumbnailBlobId = row.thumbnailBlobId;
    if (thumbnailBlobId) {
      const thumbHead = await this.storage.headObject({
        bucket: row.bucket,
        key: this.keyOf(row, thumbnailBlobId),
      });
      if (!thumbHead) thumbnailBlobId = null;
    }

    const confirmed = await this.repository.confirm(row.id, activeUser.orgId, {
      sizeBytes: head.contentLength,
      thumbnailBlobId,
    });
    if (!confirmed) throw new NotFoundException(k.attachments.errors.notFound);

    this.logger.info(
      { attachmentId: row.id, sizeBytes: head.contentLength },
      'Attachment confirmed',
    );

    return this.serialize(confirmed);
  }

  async list(
    activeUser: ActiveUser,
    dto: ListAttachmentsRequest,
  ): Promise<ListAttachmentsResponse> {
    await this.requireSubject(dto.subjectType, dto.subjectId, activeUser.orgId);

    const rows = await this.repository.listUploadedBySubject(
      activeUser.orgId,
      dto.subjectType,
      dto.subjectId,
    );

    return { data: await Promise.all(rows.map((row) => this.withReadUrls(row))) };
  }

  async readUrl(
    activeUser: ActiveUser,
    dto: GetAttachmentReadUrlRequest,
  ): Promise<AttachmentWithUrls> {
    const row = await this.repository.findById(dto.id, activeUser.orgId);
    if (!row || row.status !== 'uploaded') {
      throw new NotFoundException(k.attachments.errors.notFound);
    }
    return this.withReadUrls(row);
  }

  async delete(activeUser: ActiveUser, dto: DeleteAttachmentRequest): Promise<void> {
    const row = await this.repository.findById(dto.id, activeUser.orgId);
    if (!row) throw new NotFoundException(k.attachments.errors.notFound);

    // Best-effort object deletes; the soft-deleted row is the sweep's
    // safety net if storage is unreachable right now.
    try {
      await this.storage.deleteFile({ bucket: row.bucket, key: this.keyOf(row) });
      if (row.thumbnailBlobId) {
        await this.storage.deleteFile({
          bucket: row.bucket,
          key: this.keyOf(row, row.thumbnailBlobId),
        });
      }
    } catch (error) {
      this.logger.warn({ attachmentId: row.id, error }, 'Attachment object delete failed');
    }

    await this.repository.softDelete(row.id, activeUser.orgId);
  }

  /**
   * The key layout's payoff (docs/storage.md §5): removing a subject removes
   * every blob it ever owned with one prefix delete. Call this from domain
   * code when the subject itself is deleted; rows are the caller's to clean
   * (usually a cascade or the sweep).
   */
  async deleteSubjectPrefix(orgId: string, subjectType: string, subjectId: string): Promise<void> {
    await this.storage.deleteDirectory({ prefix: `org/${orgId}/${subjectType}/${subjectId}/` });
  }

  private async withReadUrls(row: AttachmentRow): Promise<AttachmentWithUrls> {
    const [signed, thumbnailSigned] = await Promise.all([
      this.storage.createSignedReadUrl({
        bucket: row.bucket,
        key: this.keyOf(row),
        filename: row.fileName ?? undefined,
        responseContentType: row.mimeType,
      }),
      row.thumbnailBlobId
        ? this.storage.createSignedReadUrl({
            bucket: row.bucket,
            key: this.keyOf(row, row.thumbnailBlobId),
          })
        : Promise.resolve(null),
    ]);

    return {
      attachment: this.serialize(row),
      readUrl: signed.url,
      thumbnailReadUrl: thumbnailSigned?.url ?? null,
    };
  }

  private async requireSubject(
    subjectType: string,
    subjectId: string,
    orgId: string,
  ): Promise<void> {
    const resolver = this.subjects[subjectType];
    if (!resolver) throw new BadRequestException(k.attachments.errors.unknownSubject);
    const exists = await resolver(subjectId, orgId);
    if (!exists) throw new NotFoundException(k.attachments.errors.subjectNotFound);
  }

  private keyOf(row: AttachmentRow, blobId?: string): string {
    return `org/${row.orgId}/${row.subjectType}/${row.subjectId}/${blobId ?? row.blobId}`;
  }

  /**
   * Memoized bucket init that FORGETS failures — caching a rejected promise
   * (servicebook's version) bricks uploads until restart after one boot blip.
   */
  private ensureBucket(): Promise<void> {
    this.bucketReady ??= this.initBucket().catch((error: unknown) => {
      this.bucketReady = undefined;
      throw error;
    });
    return this.bucketReady;
  }

  private async initBucket(): Promise<void> {
    await this.storage.ensureBucket();
    await this.storage.configureBucketCors();
  }

  private serialize(row: AttachmentRow): Attachment {
    return {
      id: row.id,
      orgId: row.orgId,
      subjectType: row.subjectType,
      subjectId: row.subjectId,
      kind: row.kind as Attachment['kind'],
      status: row.status as Attachment['status'],
      fileName: row.fileName,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      waveform: row.waveform,
      hasThumbnail: row.thumbnailBlobId !== null,
      uploadedBy: row.uploadedBy,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
