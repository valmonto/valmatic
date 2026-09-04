import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, type OnModuleInit } from '@nestjs/common';
import { Queue, type Job } from 'bullmq';
import {
  DATABASE_CLIENT,
  type DatabaseClient,
  attachment,
  and,
  eq,
  isNull,
  isNotNull,
  lt,
  type AttachmentRow,
} from '@pkg/database';
import { ATTACHMENTS_SWEEP_QUEUE, InjectLogger, PinoLogger, StorageService } from '@pkg/server';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/**
 * The storage GC (docs/storage.md §3). Three predicates, each bounded per
 * run, all idempotent — a crash mid-sweep just means the next tick finishes:
 *
 *  1. `pending` older than 24h → the client never confirmed; best-effort
 *     object delete, hard-delete the row.
 *  2. `uploaded` past `expires_at` → delete objects, soft-delete the row.
 *  3. soft-deleted older than 7d → delete objects (usually already gone),
 *     hard-delete the row.
 */
@Processor(ATTACHMENTS_SWEEP_QUEUE.name, ATTACHMENTS_SWEEP_QUEUE.workerOptions)
export class AttachmentsSweepProcessor extends WorkerHost implements OnModuleInit {
  constructor(
    @Inject(DATABASE_CLIENT) private readonly dbClient: DatabaseClient,
    private readonly storage: StorageService,
    @InjectQueue(ATTACHMENTS_SWEEP_QUEUE.name) private readonly queue: Queue,
    @InjectLogger() private readonly logger: PinoLogger,
  ) {
    super();
  }

  /** Self-scheduling: the worker owns its own heartbeat, nothing enqueues it. */
  async onModuleInit(): Promise<void> {
    await this.queue.upsertJobScheduler('attachments-sweep-tick', {
      every: ATTACHMENTS_SWEEP_QUEUE.repeatEveryMs,
    });
  }

  async process(_job: Job): Promise<{ pending: number; expired: number; purged: number }> {
    const now = Date.now();
    const limit = ATTACHMENTS_SWEEP_QUEUE.batchSize;

    const stalePending = await this.dbClient.db
      .select()
      .from(attachment)
      .where(
        and(
          eq(attachment.status, 'pending'),
          lt(
            attachment.createdAt,
            new Date(now - ATTACHMENTS_SWEEP_QUEUE.pendingMaxAgeHours * HOUR_MS),
          ),
          isNull(attachment.deletedAt),
        ),
      )
      .limit(limit);
    for (const row of stalePending) {
      await this.deleteObjects(row);
      await this.dbClient.db.delete(attachment).where(eq(attachment.id, row.id));
    }

    const expired = await this.dbClient.db
      .select()
      .from(attachment)
      .where(
        and(
          eq(attachment.status, 'uploaded'),
          isNotNull(attachment.expiresAt),
          lt(attachment.expiresAt, new Date(now)),
          isNull(attachment.deletedAt),
        ),
      )
      .limit(limit);
    for (const row of expired) {
      await this.deleteObjects(row);
      await this.dbClient.db
        .update(attachment)
        .set({ deletedAt: new Date() })
        .where(eq(attachment.id, row.id));
    }

    const purgeable = await this.dbClient.db
      .select()
      .from(attachment)
      .where(
        and(
          isNotNull(attachment.deletedAt),
          lt(
            attachment.deletedAt,
            new Date(now - ATTACHMENTS_SWEEP_QUEUE.softDeletedRetentionDays * DAY_MS),
          ),
        ),
      )
      .limit(limit);
    for (const row of purgeable) {
      await this.deleteObjects(row);
      await this.dbClient.db.delete(attachment).where(eq(attachment.id, row.id));
    }

    const result = {
      pending: stalePending.length,
      expired: expired.length,
      purged: purgeable.length,
    };
    if (result.pending + result.expired + result.purged > 0) {
      this.logger.info(result, 'Attachments sweep');
    }
    return result;
  }

  /** Best-effort: a missing object or a storage blip must not wedge the sweep. */
  private async deleteObjects(row: AttachmentRow): Promise<void> {
    const keyOf = (blobId: string): string =>
      `org/${row.orgId}/${row.subjectType}/${row.subjectId}/${blobId}`;
    try {
      await this.storage.deleteFile({ bucket: row.bucket, key: keyOf(row.blobId) });
      if (row.thumbnailBlobId) {
        await this.storage.deleteFile({ bucket: row.bucket, key: keyOf(row.thumbnailBlobId) });
      }
    } catch (error) {
      this.logger.warn({ attachmentId: row.id, error }, 'Sweep object delete failed');
    }
  }
}
