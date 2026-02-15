import { pgTable, pgEnum, uuid, timestamp, primaryKey, index } from 'drizzle-orm/pg-core';
import { ORGANIZATION_USER_ROLES } from '@pkg/contracts';
import { organization } from './organization';
import { user } from './user';

export const organizationUserRoleEnum = pgEnum('organization_user_role', ORGANIZATION_USER_ROLES);

export const organizationUser = pgTable(
  'organization_user',
  {
    orgId: uuid('org_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    role: organizationUserRoleEnum('role').notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.orgId, table.userId] }),
    // Index on userId for "find all orgs for user" queries
    // (orgId is already efficiently indexed as the first column of the composite PK)
    index('organization_user_user_id_idx').on(table.userId),
  ],
);

export type OrganizationUser = typeof organizationUser.$inferSelect;
export type NewOrganizationUser = typeof organizationUser.$inferInsert;
export type OrganizationUserRole = (typeof organizationUserRoleEnum.enumValues)[number];
