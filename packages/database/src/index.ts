// Client exports
export {
  createDatabaseClient,
  createDatabaseClientFromEnv,
  type DatabaseClient,
  type DatabaseConfig,
} from './client.js';

// Migration exports
export { runMigrations, runMigrationsFromEnv } from './migrate.js';

// NestJS module exports
export { DatabaseModule, DATABASE_CLIENT, type DatabaseModuleOptions } from './nestjs/index.js';

// Re-export schema for convenience
export * from './schema/index.js';

// Re-export drizzle utilities that are commonly needed
export {
  eq,
  ne,
  gt,
  gte,
  lt,
  lte,
  and,
  or,
  like,
  ilike,
  isNull,
  isNotNull,
  sql,
  count,
  desc,
  asc,
} from 'drizzle-orm';
