import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, mergeConfig } from 'vitest/config';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const pkg = (...segments) => resolve(repoRoot, 'packages', ...segments);

/**
 * Workspace packages publish `dist/` entry points, which only exist after
 * `pnpm -r build`. Tests resolve them to TypeScript source instead, so a fresh
 * clone (or CI checkout, or agent worktree) can run the suite without building
 * first. Keep in sync with the `@pkg/*` packages that build to `dist/`.
 */
export const workspaceAliases = {
  '@pkg/contracts': pkg('contracts/src/index.ts'),
  '@pkg/database/schema': pkg('database/src/schema/index.ts'),
  '@pkg/database': pkg('database/src/index.ts'),
  '@pkg/locales': pkg('locales/src/index.ts'),
  '@pkg/server': pkg('server/src/index.ts'),
  '@pkg/utils': pkg('utils/src/index.ts'),
};

/**
 * Shared Vitest config for Node-side workspaces (api, worker, packages).
 * Pass overrides to extend; they are merged over these defaults.
 *
 * @param {import('vitest/config').UserConfig} [overrides]
 */
export function base(overrides = {}) {
  return mergeConfig(
    defineConfig({
      test: {
        globals: true,
        environment: 'node',
        include: ['__tests__/**/*.test.ts', 'src/**/*.test.ts'],
        // Workspaces add their own `'@/'` self-alias, which is path-relative.
        alias: { ...workspaceAliases },
        coverage: {
          provider: 'v8',
          include: ['src/**/*.ts'],
          exclude: ['src/**/index.ts', 'src/**/*.module.ts', 'src/**/*.d.ts'],
        },
      },
    }),
    defineConfig(overrides),
  );
}
