# `@pkg/eslint-config`

Shared ESLint flat configs. One set of rules across the monorepo, so lint
failures mean the same thing everywhere.

## Which one to use

| Export | For | Adds |
|---|---|---|
| `base` | packages, anything Node-agnostic | eslint + typescript-eslint recommended, prettier compat |
| `nestjs` | `apps/api`, `apps/worker` | Node globals, decorator-friendly rules |
| `react` | `apps/web` | browser globals, `eslint-plugin-react-hooks` |

```js
// eslint.config.js
import { base } from '@pkg/eslint-config/base';

export default base;
```

Import the **named export**, not a default: `@pkg/eslint-config/base.js` is not
in the exports map and fails to resolve. That mistake sat in `packages/locales`
long enough to break `pnpm lint` before anyone noticed, because lint was not
in CI.

## What base sets

- unused vars are a **warning**, and `_`-prefixed ones are ignored
- `@typescript-eslint/consistent-type-imports` is an **error** — a type import
  must say `import type`, which is what keeps types out of runtime bundles
- `no-explicit-any` is a warning, not an error
- prettier conflicts are switched off; formatting is `pnpm format`, not lint
- `dist`, `build`, `coverage` and `node_modules` are ignored
- `**/*.{js,mjs,cjs}` gets Node globals and type-aware rules disabled — those
  files are config and `bin/` scripts, not typed source

## Adding a rule

Put it in `base.js` if it should apply everywhere, otherwise in the runtime
variant. A rule that only suits one workspace belongs in that workspace's own
`eslint.config.js`, layered on top of the shared export.

Prefer warnings for anything stylistic. `pnpm verify` fails on errors, so an
error should mean the code is wrong rather than untidy — a gate people learn to
ignore protects nothing.
