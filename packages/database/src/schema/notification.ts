import { pgTable, pgEnum, uuid, varchar, timestamp, boolean, jsonb, index } from 'drizzle-orm/pg-core';
import { pk } from './helpers';
import { user } from './user';
import { organization } from './organization';

export const notificationTypeEnum = pgEnum('notification_type', [
  'info',
  'success',
  'warning',
  'error',
]);

export const notificationChannelEnum = pgEnum('notification_channel', [
  'in_app',
  'email',
  'push',
]);

export const notification = pgTable(
  'notification',
  {
    id: pk(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    orgId: uuid('org_id').references(() => organization.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').notNull().default('info'),
    channel: notificationChannelEnum('channel').notNull().default('in_app'),
    title: varchar('title', { length: 255 }).notNull(),
    message: varchar('message', { length: 1000 }),
    link: varchar('link', { length: 500 }),
    data: jsonb('data').$type<Record<string, unknown>>(),
    read: boolean('read').notNull().default(false),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('notification_user_id_idx').on(table.userId),
    index('notification_org_id_idx').on(table.orgId),
    index('notification_user_read_idx').on(table.userId, table.read),
    index('notification_created_at_idx').on(table.createdAt),
  ],
);

export type Notification = typeof notification.$inferSelect;
export type NewNotification = typeof notification.$inferInsert;
export type NotificationType = (typeof notificationTypeEnum.enumValues)[number];
export type NotificationChannel = (typeof notificationChannelEnum.enumValues)[number];
