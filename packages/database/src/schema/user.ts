import { pgTable, varchar, timestamp, check, uuid, type AnyPgColumn } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { pk } from './helpers.js';
import { SYSTEM_ROLES, type SystemRole as SystemRoleType } from '@pkg/contracts';

export const user = pgTable(
  'user',
  {
    id: pk(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    displayName: varchar('display_name', { length: 255 }),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 50 }),
    // varchar rather than pgEnum on purpose: a Postgres enum cannot lose a
    // value without rebuilding the type. The value set lives in @pkg/contracts;
    // $type enforces it at compile time, the CHECK below at the database.
    systemRole: varchar('system_role', { length: 32 })
      .$type<SystemRoleType>()
      .notNull()
      .default('USER'),
    /**
     * When the owner proved the address is theirs by opening an emailed link
     * (or arrived through one, like an invitation). `null` until then. It
     * blocks nothing; it is what makes password reset safe to rely on.
     */
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    /**
     * Set when a platform admin disables the account; `null` is the normal
     * state. A disabled account cannot sign in or refresh a session, and its
     * live sessions are revoked at the moment it is disabled. The row and
     * everything it owns stay — disabling is the reversible alternative to
     * deleting.
     */
    disabledAt: timestamp('disabled_at', { withTimezone: true }),
    /** Who disabled it. Survives that admin being deleted: set null, not cascade. */
    disabledBy: uuid('disabled_by').references((): AnyPgColumn => user.id, {
      onDelete: 'set null',
    }),
    /** Why, in the admin's own words — shown back in the dashboard, never to the user. */
    disabledReason: varchar('disabled_reason', { length: 500 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  () => [
    check(
      'user_system_role_check',
      sql.raw(`system_role IN (${SYSTEM_ROLES.map((v) => `'${v}'`).join(', ')})`),
    ),
  ],
);

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type SystemRole = SystemRoleType;
