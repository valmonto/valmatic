import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

/**
 * Run database migrations.
 * This is a standalone script that can be run from CLI or during deployment.
 */
export async function runMigrations(databaseUrl: string, migrationsFolder: string) {
  const sql = postgres(databaseUrl, { max: 1 });
  const db = drizzle(sql);

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

  await runMigrations(url, migrationsFolder);
}
