import { relations } from 'drizzle-orm';
import { user } from './user';
import { organization } from './organization';
import { organizationUser } from './organization-user';
import { notification } from './notification';

// User relations
export const userRelations = relations(user, ({ many }) => ({
  availableOrganizations: many(organizationUser),
  notifications: many(notification),
}));

// Organization relations
export const organizationRelations = relations(organization, ({ one, many }) => ({
  owner: one(user, {
    fields: [organization.ownerId],
    references: [user.id],
  }),
  members: many(organizationUser),
  notifications: many(notification),
}));

// OrganizationUser (junction) relations
export const organizationUserRelations = relations(organizationUser, ({ one }) => ({
  organization: one(organization, {
    fields: [organizationUser.orgId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [organizationUser.userId],
    references: [user.id],
  }),
}));

// Notification relations
export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, {
    fields: [notification.userId],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [notification.orgId],
    references: [organization.id],
  }),
}));
