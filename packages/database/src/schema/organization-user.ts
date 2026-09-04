import { pgTable, uuid, varchar, timestamp, primaryKey, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import {
  ORGANIZATION_USER_ROLES,
  type OrganizationUserRole as OrganizationUserRoleType,
} from '@pkg/contracts';
import { organization } from './organization.js';
import { user } from './user.js';

export const organizationUser = pgTable(
  'organization_user',
  {
    orgId: uuid('org_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    // varchar + CHECK, not pgEnum — see user.ts for the reasoning.
    role: varchar('role', { length: 32 }).$type<OrganizationUserRoleType>().notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.orgId, table.userId] }),
    // Index on userId for "find all orgs for user" queries
    // (orgId is already efficiently indexed as the first column of the composite PK)
    index('organization_user_user_id_idx').on(table.userId),
    check(
      'organization_user_role_check',
      sql.raw(`role IN (${ORGANIZATION_USER_ROLES.map((v) => `'${v}'`).join(', ')})`),
    ),
  ],
);

export type OrganizationUser = typeof organizationUser.$inferSelect;
export type NewOrganizationUser = typeof organizationUser.$inferInsert;
export type OrganizationUserRole = OrganizationUserRoleType;
