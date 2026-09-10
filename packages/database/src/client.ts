import { drizzle } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';
import { relations } from './schema/relations.js';
import { buildVerifiedTls, hostFromConnectionUrl } from './tls.js';

export interface DatabaseConfig {
  url: string;
  maxConnections?: number;
  idleTimeout?: number;
  connectionTimeout?: number;
  /**
   * PEM of the certificate authority that signed the server's certificate,
   * for a database reached over TLS with a PRIVATE CA. Omit for a local or
   * container-network database, or for one whose certificate a public CA
   * signed. See tls.ts for why this cannot live in the URL.
   */
  caCert?: string;
}

export type DrizzleOrm = ReturnType<typeof drizzle<typeof relations>>;

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
  const host = config.caCert ? hostFromConnectionUrl(config.url) : null;
  const sql = postgres(config.url, {
    max: config.maxConnections ?? 10,
    idle_timeout: config.idleTimeout ?? 20,
    connect_timeout: config.connectionTimeout ?? 10,
    prepare: false, // Required for connection poolers like PgBouncer
    // Only when a CA is supplied AND the URL names a host to verify against.
    // Without both there is nothing to check, and a half-configured TLS option
    // is worse than none: it looks verified and is not.
    ...(config.caCert && host
      ? { ssl: buildVerifiedTls(host, config.caCert) as never }
      : {}),
  });

  const db = drizzle({ client: sql, relations });

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
    // Read here for the same reason the Nest factory reads it: a private CA
    // cannot ride in DATABASE_URL, so a caller that has only the environment
    // to go on would otherwise verify `?sslmode=verify-full` against the system
    // trust store and fail with UNABLE_TO_VERIFY_LEAF_SIGNATURE.
    caCert: process.env.DATABASE_CA_CERT,
  });
}
