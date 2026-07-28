# `@pkg/vitest-config`

Shared Vitest config. Each workspace's `vitest.config.ts` is a few lines instead
of a copied block, and — the reason this package exists — tests resolve
workspace packages from **source**, so a suite runs without building first.

## Use

```ts
// packages/thing/vitest.config.ts
import { base } from '@pkg/vitest-config/base';

export default base({
  test: {
    setupFiles: ['./__tests__/setup.ts'],
    alias: { '@/': new URL('./src/', import.meta.url).pathname },
  },
});
```

`base` for Node workspaces, `react` for `apps/web` (jsdom plus the React
plugin). Overrides merge over the defaults.

The `'@/'` self-alias stays in each workspace because it is path-relative.

## Why it exists

`@pkg/*` packages publish `dist/` entry points that only exist after
`pnpm -r build`. Without an alias, `pnpm test` on a fresh clone fails with
`Failed to resolve entry for package "@pkg/locales"` — and that is a bad
failure, because a red suite you did not cause is indistinguishable from one
you did. CI checkouts and agent worktrees hit it every time.

`base.js` maps each package to its TypeScript source, so tests need no build,
run faster, and never depend on build order. Keep `workspaceAliases` in step
when a package is added.

## Defaults

`globals: true`, node environment, `__tests__/**/*.test.ts` plus co-located
`src/**/*.test.ts`, and v8 coverage excluding barrels and module files.

`react` swaps in jsdom, `@vitejs/plugin-react-swc`, and `.tsx` matching.
