import { pgTable, uuid, varchar, timestamp, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import {
  INVITATION_STATUSES,
  ORGANIZATION_USER_ROLES,
  type InvitationStatus as InvitationStatusType,
  type OrganizationUserRole as OrganizationUserRoleType,
} from '@pkg/contracts';
import { pk } from './helpers';
import { organization } from './organization';
import { user } from './user';

/**
 * An invitation to join an organization at a given role.
 *
 * DOMAIN-BLIND by construction: the columns are exactly {org, email, role,
 * token} plus lifecycle bookkeeping (status/expiry/inviter). No project or
 * feature column ever lands here — an app that needs to carry extra context
 * through an invite adds a generic opaque metadata mechanism, never a domain
 * column on this table.
 *
 * The token follows the api-key pattern: the raw secret is shown once, in the
 * create response, and only its sha256 hex (`tokenHash`) is stored — so a
 * database leak never yields a usable link. Email-binding, single-use and
 * expiry are all enforced in the service at accept time.
 */
export const invitation = pgTable(
  'invitation',
  {
    id: pk(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 255 }).notNull(),
    // The org role the invite grants. varchar + CHECK, not pgEnum — see user.ts
    // for the reasoning; value set comes from @pkg/contracts.
    role: varchar('role', { length: 32 }).$type<OrganizationUserRoleType>().notNull(),
    tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
    status: varchar('status', { length: 16 })
      .$type<InvitationStatusType>()
      .notNull()
      .default('pending'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    // Attribution survives the inviter being removed from the org: set null
    // rather than cascade, so revoking a person does not erase the audit trail.
    invitedBy: uuid('invited_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // "Pending invites for the active org" is the hot read.
    index('invitation_org_status_idx').on(table.orgId, table.status),
    index('invitation_email_idx').on(table.email),
    check(
      'invitation_role_check',
      sql.raw(`role IN (${ORGANIZATION_USER_ROLES.map((v) => `'${v}'`).join(', ')})`),
    ),
    check(
      'invitation_status_check',
      sql.raw(`status IN (${INVITATION_STATUSES.map((v) => `'${v}'`).join(', ')})`),
    ),
  ],
);

export type Invitation = typeof invitation.$inferSelect;
export type NewInvitation = typeof invitation.$inferInsert;
