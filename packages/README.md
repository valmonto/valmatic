# Packages

Shared code for the apps. Each package has its own README with conventions and
recipes; this is the map.

## Runtime

| Package | What it owns | Depends on |
|---|---|---|
| [`contracts`](contracts) | Zod schemas, inferred types, the permission model | — |
| [`database`](database) | Drizzle schema, Postgres client, migrations | contracts |
| [`server`](server) | the shared NestJS layer — auth, guards, health, queues | contracts, locales |
| [`locales`](locales) | translation keys and strings | — |
| [`utils`](utils) | framework-agnostic helpers | — |

## Tooling

| Package | What it owns |
|---|---|
| [`testing`](testing) | test fakes, golden harness, and the testing conventions |
| [`vitest-config`](vitest-config) | shared Vitest config |
| [`eslint-config`](eslint-config) | shared ESLint config |
| [`tsconfig`](tsconfig) | shared TypeScript config |

## How they fit together

```
contracts ──┬──→ database ──┐
            │               ├──→ apps/api, apps/worker
            └──→ server ────┘
locales ────────→ server

contracts, locales, utils ────→ apps/web, apps/mobile   (client entries only)
```

Dependencies point one way. `contracts` sits at the bottom because it is the
one thing every side agrees on — a shape change there is a compile error in the
API, the web app and mobile at once, which is the point.

Nothing depends on `utils`; everything may.

## Which package does this belong in?

| It needs | Put it in |
|---|---|
| a request/response shape, a permission | `contracts` |
| a table, a query, a migration | `database` |
| a guard, a filter, transport wiring | `server` |
| user-facing text | `locales` |
| a pure helper two workspaces want | `utils` |
| a test fake or harness | `testing` |

Feature logic belongs in the app, not here. `server` owns *that requests are
authenticated*; `apps/api/src/user/` owns users.

The bar for adding to a shared package is **a second consumer** — until then it
lives in the workspace that needs it, where it can change freely.

## Frontend imports

`contracts` is the one to watch: its root entry pulls in Zod. Web and mobile
alias `@pkg/contracts` to a Zod-free client entry, so the bare specifier is
already the safe one — see [`contracts/README.md`](contracts).

## Conventions

- **Split by domain, not by kind** — `schemas/auth.schema.ts`,
  `constants/iam.ts`. A file per kind becomes a junk drawer.
- **Export explicitly from `index.ts`**, so the public surface is readable in
  one file.
- **Import from the package root**, never a deep path.
- Every package builds to `dist/`, but types and test aliases resolve `src/` —
  changes apply without rebuilding.
