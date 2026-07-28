# `@pkg/tsconfig`

Shared TypeScript settings. Every workspace extends one of these rather than
carrying its own compiler options, so strictness cannot quietly differ between
packages.

## Which one to extend

| Config | For | Emits |
|---|---|---|
| `base.json` | the shared settings; not extended directly | no |
| `library.json` | packages that build to `dist/` | yes → `dist/` |
| `nestjs.json` | `apps/api`, `apps/worker` | yes → `dist/` |
| `react.json` | `apps/web` | no — Vite compiles |

```json
{
  "extends": "@pkg/tsconfig/nestjs.json",
  "compilerOptions": { "outDir": "./dist" },
  "include": ["src", "__tests__"]
}
```

Include `__tests__` as well as `src` — typescript-eslint parses through the
project service, so a spec outside `include` fails linting with a parsing error
rather than a type error. Where the build must stay clean of tests, add a
`tsconfig.build.json` that narrows `include` back to `src` (Nest picks it up
automatically); `apps/api` and `apps/worker` do this.

## What base turns on

`strict`, plus two that catch more than they cost:

- **`noUncheckedIndexedAccess`** — `arr[0]` is `T | undefined`. It is the reason
  index access needs a guard or `?.`, and it removes a whole class of runtime
  `undefined`.
- **`verbatimModuleSyntax`** — imports are emitted as written, so a type import
  must say `import type`. That is what stops a type-only import from pulling a
  module into a bundle at runtime.

`react.json` and `nestjs.json` both turn `verbatimModuleSyntax` **off**: JSX and
Nest's decorator metadata need TypeScript to make its own decisions about
imports.

## Notes

`nestjs.json` stays on classic module resolution and silences the TS 6
deprecation. Moving to `node16` would require explicit `.js` extensions
throughout every package's source, because the packages expose raw `src/*.ts`
as their types — a monorepo-wide migration, not a per-app change.
