import { defineConfig } from 'tsdown';

// Single config so `clean` runs once. A previous array-of-configs setup ran
// both builds concurrently, and the first config's `clean: true` could wipe
// `dist/` while the second was writing `dist/cli/migrate.mjs`, leaving the CLI
// entry intermittently missing.
export default defineConfig({
  entry: ['src/index.ts', 'src/schema/index.ts', 'src/cli/migrate.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ['postgres'],
});
