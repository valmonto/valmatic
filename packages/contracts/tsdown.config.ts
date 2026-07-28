import { defineConfig } from 'tsdown';

export default defineConfig({
  // One entry per subpath in package.json `exports`. `client` is the
  // frontend-safe surface; keeping it a separate entry is what lets a bundler
  // include it without reaching the Zod-bearing schema graph.
  entry: [
    'src/index.ts',
    'src/client/index.ts',
    'src/types/index.ts',
    'src/schemas/index.ts',
    'src/constants/index.ts',
    'src/permissions/index.ts',
  ],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
});
