import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: true,
    // pino is a TYPE-imported transitive (not a declared dep), so tsdown's
    // auto-externalization misses it and the dts bundler tries to inline its
    // CommonJS type defs — missing-export errors, found by specbook's first
    // Docker build. Externalizing the root stops the whole traversal.
    // (external: [] — the previous value — was worse: it overrode
    // auto-externalization entirely.)
    external: ['pino'],
  },
]);
