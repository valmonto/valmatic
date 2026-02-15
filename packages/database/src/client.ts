import { drizzle } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';
import * as schema from './schema';

export interface DatabaseConfig {
  url: string;
  maxConnections?: number;
  idleTimeout?: number;
  connectionTimeout?: number;
}

export type DrizzleOrm = ReturnType<typeof drizzle<typeof schema>>;

export interface DatabaseClient {
  /** The Drizzle ORM instance for queries */
  db: DrizzleOrm;
  /** Close all connections gracefully */
  close: () => Promise<void>;
  /** NestJS lifecycle hook - called automatically on shutdown when using DatabaseModule */
  onModuleDestroy?: () => Promise<void>;
  /** The underlying postgres.js client (for advanced use cases) */
  sql: Sql;
}

/**
 * Create a database client with the given configuration.
 * For production, use sensible defaults for connection pooling.
 */
export function createDatabaseClient(config: DatabaseConfig): DatabaseClient {
  const sql = postgres(config.url, {
    max: config.maxConnections ?? 10,
    idle_timeout: config.idleTimeout ?? 20,
    connect_timeout: config.connectionTimeout ?? 10,
    prepare: false, // Required for connection poolers like PgBouncer
  });

  const db = drizzle(sql, { schema });

  const close = async () => {
    await sql.end();
  };

  return {
    db,
    sql,
    close,
    onModuleDestroy: close,
  };
}

/**
 * Create a database client from environment variables.
 * Throws if DATABASE_URL is not set.
 */
export function createDatabaseClientFromEnv(): DatabaseClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  return createDatabaseClient({
    url,
    maxConnections: process.env.DATABASE_MAX_CONNECTIONS
      ? parseInt(process.env.DATABASE_MAX_CONNECTIONS, 10)
      : undefined,
  });
}
