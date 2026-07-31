import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: true,
    // fastify and pino are TYPE-imported transitives (not declared deps), so
    // tsdown's auto-externalization misses them and the dts bundler tries to
    // inline their CommonJS type defs — 54 missing-export errors, found by
    // specbook's first Docker build. Externalizing the two roots stops the
    // whole traversal. (external: [] — the previous value — was worse: it
    // overrode auto-externalization entirely.)
    external: ['fastify', 'pino'],
  },
]);
