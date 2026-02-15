import { sql } from 'drizzle-orm';
import { uuid } from 'drizzle-orm/pg-core';

/**
 * Primary key with auto-generated UUIDv7.
 * UUIDv7 is time-sortable, making it ideal for distributed systems and better index performance.
 */
export const pk = (name = 'id') => uuid(name).primaryKey().default(sql`uuidv7()`);
