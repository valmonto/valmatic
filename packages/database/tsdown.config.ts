import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    entry: ['src/index.ts', 'src/schema/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: true,
    external: ['postgres'],
  },
  {
    entry: ['src/cli/migrate.ts'],
    format: ['esm'],
    outDir: 'dist/cli',
    clean: false,
    sourcemap: true,
    external: ['postgres'],
  },
]);
