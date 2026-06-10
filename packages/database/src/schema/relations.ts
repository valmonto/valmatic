import { defineRelations } from 'drizzle-orm';
import { user } from './user';
import { organization } from './organization';
import { organizationUser } from './organization-user';
import { notification } from './notification';

/**
 * Relational config for the relational query builder (drizzle v1 API).
 * Replaces the per-table `relations()` helpers from drizzle v0.
 */
export const relations = defineRelations(
  { user, organization, organizationUser, notification },
  (r) => ({
    user: {
      availableOrganizations: r.many.organizationUser(),
      notifications: r.many.notification(),
    },
    organization: {
      owner: r.one.user({
        from: r.organization.ownerId,
        to: r.user.id,
      }),
      members: r.many.organizationUser(),
      notifications: r.many.notification(),
    },
    organizationUser: {
      organization: r.one.organization({
        from: r.organizationUser.orgId,
        to: r.organization.id,
      }),
      user: r.one.user({
        from: r.organizationUser.userId,
        to: r.user.id,
      }),
    },
    notification: {
      user: r.one.user({
        from: r.notification.userId,
        to: r.user.id,
      }),
      organization: r.one.organization({
        from: r.notification.orgId,
        to: r.organization.id,
      }),
    },
  }),
);
