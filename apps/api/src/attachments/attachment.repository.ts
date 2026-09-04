import { Inject, Injectable } from '@nestjs/common';
import {
  DATABASE_CLIENT,
  type DatabaseClient,
  attachment,
  and,
  asc,
  eq,
  isNull,
  type AttachmentRow,
  type NewAttachmentRow,
} from '@pkg/database';

/** Every read and write carries orgId — an attachment never crosses tenants. */
@Injectable()
export class AttachmentRepository {
  constructor(@Inject(DATABASE_CLIENT) private readonly dbClient: DatabaseClient) {}

  async insert(row: NewAttachmentRow): Promise<AttachmentRow> {
    const [created] = await this.dbClient.db.insert(attachment).values(row).returning();
    return created!;
  }

  async findById(id: string, orgId: string): Promise<AttachmentRow | null> {
    const [row] = await this.dbClient.db
      .select()
      .from(attachment)
      .where(and(eq(attachment.id, id), eq(attachment.orgId, orgId), isNull(attachment.deletedAt)))
      .limit(1);
    return row ?? null;
  }

  async listUploadedBySubject(
    orgId: string,
    subjectType: string,
    subjectId: string,
  ): Promise<AttachmentRow[]> {
    return this.dbClient.db
      .select()
      .from(attachment)
      .where(
        and(
          eq(attachment.orgId, orgId),
          eq(attachment.subjectType, subjectType),
          eq(attachment.subjectId, subjectId),
          eq(attachment.status, 'uploaded'),
          isNull(attachment.deletedAt),
        ),
      )
      .orderBy(asc(attachment.createdAt));
  }

  /**
   * Compare-and-swap pending → uploaded: a double confirm (or a confirm
   * racing the sweep) loses cleanly by updating zero rows.
   */
  async confirm(
    id: string,
    orgId: string,
    patch: { sizeBytes: number; thumbnailBlobId: string | null },
  ): Promise<AttachmentRow | null> {
    const [row] = await this.dbClient.db
      .update(attachment)
      .set({
        status: 'uploaded',
        sizeBytes: patch.sizeBytes,
        thumbnailBlobId: patch.thumbnailBlobId,
      })
      .where(
        and(
          eq(attachment.id, id),
          eq(attachment.orgId, orgId),
          eq(attachment.status, 'pending'),
          isNull(attachment.deletedAt),
        ),
      )
      .returning();
    return row ?? null;
  }

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const rows = await this.dbClient.db
      .update(attachment)
      .set({ deletedAt: new Date() })
      .where(and(eq(attachment.id, id), eq(attachment.orgId, orgId), isNull(attachment.deletedAt)))
      .returning({ id: attachment.id });
    return rows.length > 0;
  }

  /** Failed confirms remove the row entirely — there is nothing to keep. */
  async hardDelete(id: string, orgId: string): Promise<void> {
    await this.dbClient.db
      .delete(attachment)
      .where(and(eq(attachment.id, id), eq(attachment.orgId, orgId)));
  }
}
