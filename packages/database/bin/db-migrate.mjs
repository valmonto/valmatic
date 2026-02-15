#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const builtScript = resolve(__dirname, '../dist/cli/migrate.mjs');

if (!existsSync(builtScript)) {
  console.error('Error: @pkg/database has not been built. Run "pnpm build" first.');
  process.exit(1);
}

await import(builtScript);
