import { pgTable, varchar, timestamp, check } from 'drizzle-orm/pg-core';
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
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    check(
      'user_system_role_check',
      sql.raw(`system_role IN (${SYSTEM_ROLES.map((v) => `'${v}'`).join(', ')})`),
    ),
  ],
);

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type SystemRole = SystemRoleType;
