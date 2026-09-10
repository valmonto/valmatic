import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { buildVerifiedTls, hostFromConnectionUrl } from './tls.js';

/**
 * Run database migrations.
 * This is a standalone script that can be run from CLI or during deployment.
 *
 * `caCert` matters for exactly the same reason it does in createDatabaseClient
 * (see tls.ts): a private CA cannot be expressed in a connection URL, so a URL
 * carrying `?sslmode=verify-full` is verified against the SYSTEM trust store,
 * which has never heard of it. This path used to take the URL alone, so the
 * app and the worker connected to an external database happily while the
 * migration that has to run FIRST died on UNABLE_TO_VERIFY_LEAF_SIGNATURE —
 * an error naming the certificate rather than the client that ignored it.
 */
export async function runMigrations(
  databaseUrl: string,
  migrationsFolder: string,
  caCert?: string,
) {
  const host = caCert ? hostFromConnectionUrl(databaseUrl) : null;
  const sql = postgres(databaseUrl, {
    max: 1,
    ...(caCert && host ? { ssl: buildVerifiedTls(host, caCert) as never } : {}),
  });
  const db = drizzle({ client: sql });

  console.log('Running migrations...');

  await migrate(db, { migrationsFolder });

  console.log('Migrations completed successfully');

  await sql.end();
}

/**
 * Run migrations from environment variables.
 * @param migrationsFolder - Path to the migrations folder (required)
 */
export async function runMigrationsFromEnv(migrationsFolder: string) {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  await runMigrations(url, migrationsFolder, process.env.DATABASE_CA_CERT);
}
