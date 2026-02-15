import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { pk } from './helpers';
import { user } from './user';

export const organization = pgTable(
  'organization',
  {
    id: pk(),
    name: varchar('name', { length: 255 }).notNull(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index('organization_owner_id_idx').on(table.ownerId)],
);

export type Organization = typeof organization.$inferSelect;
export type NewOrganization = typeof organization.$inferInsert;
