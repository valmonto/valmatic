import {
  pgTable,
  uuid,
  varchar,
  bigint,
  jsonb,
  timestamp,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { ATTACHMENT_KINDS, ATTACHMENT_STATUSES } from '@pkg/contracts';
import { pk } from './helpers.js';
import { organization } from './organization.js';
import { user } from './user.js';

/**
 * Files are rows first; the object store holds only opaque blobs at
 * `org/{orgId}/{subjectType}/{subjectId}/{blobId}`. The subject is
 * polymorphic (no FK, no CHECK) — the set of valid subject types is the
 * app's knowledge, enforced by the resolver each app injects per type
 * ("does this subject exist in this org"), not by the schema.
 *
 * Rows are born `pending` at sign time and flip to `uploaded` only after the
 * server HEAD-verifies the object (size/mime against the declaration).
 * Readers serve `uploaded` only; a sweep purges stale pendings, expired and
 * soft-deleted rows together with their objects.
 *
 * `bucket` is recorded per row so a future backend move (managed S3, second
 * store) never needs a backfill — every row states its own blob home.
 */
export const attachment = pgTable(
  'attachment',
  {
    id: pk(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    subjectType: varchar('subject_type', { length: 32 }).notNull(),
    subjectId: uuid('subject_id').notNull(),
    kind: varchar('kind', { length: 16 }).notNull(),
    status: varchar('status', { length: 16 }).notNull().default('pending'),
    bucket: varchar('bucket', { length: 255 }).notNull(),
    blobId: uuid('blob_id').notNull(),
    thumbnailBlobId: uuid('thumbnail_blob_id'),
    fileName: varchar('file_name', { length: 255 }),
    mimeType: varchar('mime_type', { length: 255 }).notNull(),
    sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
    // Voice-message amplitude envelope (0–100 ints), captured client-side —
    // players render it without decoding audio.
    waveform: jsonb('waveform').$type<number[]>(),
    uploadedBy: uuid('uploaded_by')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('attachment_org_id_idx').on(table.orgId),
    index('attachment_subject_idx').on(table.subjectType, table.subjectId),
    // The sweep's scans: stale pendings by age, expiries, soft-deleted.
    index('attachment_status_created_idx').on(table.status, table.createdAt),
    index('attachment_expires_at_idx').on(table.expiresAt),
    check(
      'attachment_kind_check',
      sql.raw(`kind IN (${ATTACHMENT_KINDS.map((v) => `'${v}'`).join(', ')})`),
    ),
    check(
      'attachment_status_check',
      sql.raw(`status IN (${ATTACHMENT_STATUSES.map((v) => `'${v}'`).join(', ')})`),
    ),
  ],
);

export type AttachmentRow = typeof attachment.$inferSelect;
export type NewAttachmentRow = typeof attachment.$inferInsert;
