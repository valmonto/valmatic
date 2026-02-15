import { pgTable, pgEnum, varchar, timestamp } from 'drizzle-orm/pg-core';
import { pk } from './helpers';
import { SYSTEM_ROLES } from '@pkg/contracts';

export const systemRoleEnum = pgEnum('system_role', SYSTEM_ROLES);

export const user = pgTable('user', {
  id: pk(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  systemRole: systemRoleEnum('system_role').notNull().default('USER'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type SystemRole = (typeof systemRoleEnum.enumValues)[number];
