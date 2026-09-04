# valmatic

A multi-tenant SaaS boilerplate: NestJS + Fastify API, React web app, BullMQ
worker, Expo mobile app — one pnpm monorepo, one shared contract.

## What you get

- **Organizations as tenants** — every query scoped to the active org, proven
  by integration tests against a real database
- **Two-axis RBAC** — org membership roles (`OWNER|ADMIN|MEMBER`) driving a
  permission table, and platform roles (`@SystemRoles`) for admin surfaces
- **One contract** — Zod schemas in `@pkg/contracts` typed end-to-end;
  frontends import a Zod-free client entry so the validator never ships to the
  browser
- **Sessions done properly** — JWT + Redis refresh rotation, login lockout,
  logout-everywhere, roles re-read from the database on every refresh
- **Background jobs** — BullMQ queues with a worked example, attributed to the
  session user
- **i18n** — translation keys end-to-end, with a test that refuses untranslated
  keys

## Layout

|                      |                                                         |
| -------------------- | ------------------------------------------------------- |
| `apps/api`           | HTTP API — features, guards, seeding                    |
| `apps/web`           | React + Vite SPA                                        |
| `apps/worker`        | queue consumers                                         |
| `apps/mobile`        | Expo / React Native                                     |
| `apps/e2e`           | Playwright                                              |
| `packages/contracts` | schemas, types, permissions — the shared contract       |
| `packages/server`    | shared Nest layer: iam, guards, queues, logging, health |
| `packages/database`  | Drizzle schema, migrations, client                      |
| `packages/*`         | locales, utils, testing, and the config packages        |

Each workspace has its own README; start at [`packages/README.md`](packages/README.md).
[`GAPS.md`](GAPS.md) is the honest list of what is _not_ here yet.
[`CLAUDE.md`](CLAUDE.md) states the conventions for humans and agents alike.
[`docs/operations.md`](docs/operations.md) is the growth playbook — capacity,
costs, durability, scaling out and geography, each decision pre-made with its
trigger.
[`docs/agent-loop.md`](docs/agent-loop.md) is how tickets become features —
the builder/verifier/reviewer flow (agents in `.claude/agents/`), auto vs
semi-auto modes, and the always-human override list.
[`docs/agent-loop.md`](docs/agent-loop.md) is how tickets become features —
the builder/verifier/reviewer flow, auto vs semi-auto modes, and the
always-human override list.

## Run it

```bash
pnpm install
docker compose up -d          # postgres + redis
pnpm --filter @pkg/database build && pnpm db:migrate
pnpm db:seed
pnpm dev
```

## Verify it

```bash
pnpm verify                   # typecheck + lint + test
```

With `DATABASE_URL` set, the repository integration suites run too — the same
gate CI applies to every PR.

Lint is [oxlint](https://oxc.rs/docs/guide/usage/linter), configured once in
the root `.oxlintrc.json`. The Nest trees (`apps/api`, `apps/worker`,
`packages/server`) lint type-aware (`oxlint --type-aware`, powered by
`oxlint-tsgolint`), which is what enforces `no-floating-promises`. The web
app's feature boundaries — a feature never imports another feature, and the
outside world imports a feature only through its barrel — are
`no-restricted-imports` patterns in the same file. Formatting is
[oxfmt](https://oxc.rs/docs/guide/usage/formatter), Prettier-compatible output
from the same toolchain, configured in `.oxfmtrc.json`: `pnpm format` /
`pnpm format:check`.
