// Client exports
export {
  createDatabaseClient,
  createDatabaseClientFromEnv,
  type DatabaseClient,
  type DatabaseConfig,
} from './client';

// Migration exports
export { runMigrations, runMigrationsFromEnv } from './migrate';

// NestJS module exports
export { DatabaseModule, DATABASE_CLIENT, type DatabaseModuleOptions } from './nestjs';

// Re-export schema for convenience
export * from './schema';

// Re-export drizzle utilities that are commonly needed
export { eq, ne, gt, gte, lt, lte, and, or, like, ilike, sql, count, desc, asc } from 'drizzle-orm';
