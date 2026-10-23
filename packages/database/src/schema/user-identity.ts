import { pgTable, uuid, varchar, timestamp, index, uniqueIndex, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { AUTH_IDENTITY_PROVIDERS, type AuthIdentityProvider } from '@pkg/contracts';
import { pk } from './helpers.js';
import { user } from './user.js';

/**
 * An Apple or Google account linked to a user.
 *
 * The key is the provider's `sub` — its own stable, opaque id for the person —
 * never the email: Apple's private-relay addresses change when forwarding is
 * turned off, and a Google Workspace address can be handed to someone else.
 *
 * `(provider, subject)` is unique across the whole platform, so the same Apple
 * account lands on the same user every time. An account can hold several
 * links (Apple and Google both); an account belongs to no single organization,
 * so neither does its link.
 */
export const userIdentity = pgTable(
  'user_identity',
  {
    id: pk(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    // varchar + CHECK, never pgEnum (see user.ts). Value set from @pkg/contracts.
    provider: varchar('provider', { length: 16 }).$type<AuthIdentityProvider>().notNull(),
    /** The provider's stable subject id. The identity; never the email. */
    subject: varchar('subject', { length: 255 }).notNull(),
    /**
     * The address the provider gave when the link was made. Display only, and
     * nullable: Apple sends it on the first sign-in and never again.
     */
    email: varchar('email', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('user_identity_provider_subject_key').on(table.provider, table.subject),
    index('user_identity_user_id_idx').on(table.userId),
    check(
      'user_identity_provider_check',
      sql.raw(`provider IN (${AUTH_IDENTITY_PROVIDERS.map((v) => `'${v}'`).join(', ')})`),
    ),
  ],
);

export type UserIdentityRow = typeof userIdentity.$inferSelect;
export type NewUserIdentityRow = typeof userIdentity.$inferInsert;
