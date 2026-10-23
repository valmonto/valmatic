import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { pk } from './helpers.js';
import { user } from './user.js';

/**
 * One row per "I forgot my password" email that was sent.
 *
 * The link in the email carries a random token. ONLY ITS SHA-256 IS KEPT
 * here, so somebody who can read this table cannot use what they find to
 * take over an account — the same reason a password is kept as a hash.
 *
 * A row is good for one use and for a short time (`expiresAt`). `usedAt` is
 * set when the password is changed with it, and on every other open row of
 * the same account at that moment, so an older email cannot be used after a
 * newer one was.
 *
 * The rows are also the count behind "no more than a few emails a day to one
 * account": the limit is read from `createdAt`, so it holds across restarts
 * and replicas without a second store.
 */
export const passwordReset = pgTable(
  'password_reset',
  {
    id: pk(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    /** SHA-256 of the token, hex. The token itself is never stored. */
    tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('password_reset_user_created_idx').on(table.userId, table.createdAt)],
);

export type PasswordResetRow = typeof passwordReset.$inferSelect;
