import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { pk } from './helpers.js';
import { user } from './user.js';

/**
 * One row per "confirm your email address" link that was mailed.
 *
 * Kept the way `password_reset` keeps its links: only the SHA-256 of the
 * random token is stored, a row is good once and until `expiresAt`, and the
 * rows are also the count behind the daily limit of emails to one account.
 *
 * `email` is the address the link was sent TO. A user may change an
 * unconfirmed address, and a link must confirm the address it was mailed to,
 * never whatever the account says later.
 */
export const emailVerification = pgTable(
  'email_verification',
  {
    id: pk(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 255 }).notNull(),
    /** SHA-256 of the token, hex. The token itself is never stored. */
    tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('email_verification_user_created_idx').on(table.userId, table.createdAt)],
);

export type EmailVerificationRow = typeof emailVerification.$inferSelect;
