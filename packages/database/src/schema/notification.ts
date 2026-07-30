import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  jsonb,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TYPES,
  type NotificationChannel as NotificationChannelType,
  type NotificationType as NotificationTypeType,
} from '@pkg/contracts';
import { pk } from './helpers';
import { user } from './user';
import { organization } from './organization';

export const notification = pgTable(
  'notification',
  {
    id: pk(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    orgId: uuid('org_id').references(() => organization.id, { onDelete: 'cascade' }),
    // varchar + CHECK, not pgEnum — see user.ts. Value sets come from
    // @pkg/contracts, the same ones the Zod schemas validate.
    type: varchar('type', { length: 32 }).$type<NotificationTypeType>().notNull().default('info'),
    channel: varchar('channel', { length: 32 })
      .$type<NotificationChannelType>()
      .notNull()
      .default('in_app'),
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
    check(
      'notification_type_check',
      sql.raw(`type IN (${NOTIFICATION_TYPES.map((v) => `'${v}'`).join(', ')})`),
    ),
    check(
      'notification_channel_check',
      sql.raw(`channel IN (${NOTIFICATION_CHANNELS.map((v) => `'${v}'`).join(', ')})`),
    ),
  ],
);

export type Notification = typeof notification.$inferSelect;
export type NewNotification = typeof notification.$inferInsert;
export type NotificationType = NotificationTypeType;
export type NotificationChannel = NotificationChannelType;
