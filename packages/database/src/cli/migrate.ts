#!/usr/bin/env node
import { runMigrations } from '../migrate';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('ERROR: DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const migrationsFolder = resolve(__dirname, '../../src/migrations');

  try {
    await runMigrations(url, migrationsFolder);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
