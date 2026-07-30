# valmatic

pnpm monorepo SaaS boilerplate. `apps/{api,web,worker,mobile,e2e}`,
`packages/{contracts,database,server,locales,utils,testing,vitest-config,eslint-config,tsconfig}`.
Every workspace has a README that explains it; `packages/README.md` is the index.
`GAPS.md` is the honest list of what is missing.

## How the docs are layered

- **This file** — repo-wide rules, loaded into every session automatically.
- **Workspace `CLAUDE.md`** (`apps/api/CLAUDE.md`, …) — the few rules specific
  to that workspace, loaded automatically when files there are touched. Keep
  them short; anything repo-wide belongs here, not there.
- **Workspace `README.md`** — the human-depth explanation, read on demand.
  Each workspace `CLAUDE.md` opens by pointing at it.

## Definition of done

```bash
pnpm verify        # typecheck + lint + test — must exit 0
```

Done also means the documentation still tells the truth: **if a change
falsifies a claim in a README (or this file, or `GAPS.md`), fix that claim in
the same PR.** Stale docs are worse than none — they carry authority while
teaching the old behaviour. This has already happened once: an entire
hardening pass shipped while `apps/api/README.md` kept saying tenancy had no
test coverage.

Integration tests (`describeIntegration`) run only when `DATABASE_URL` is set;
without a database they skip silently, so a green run proves less. CI sets one.
The test step is serialized on purpose (api and worker suites share the test
database) — do not re-parallelize it without giving each suite its own database.

## Conventions that are load-bearing

- **Identity comes from the session, never the payload.** `@ActiveUser()`
  supplies `{ userId, orgId, orgRole, systemRole }`; request schemas carry no
  identity fields. Job payloads are attributed from the session too.
- **Two role axes, both enums contain `ADMIN` — never conflate them.**
  `orgRole` (OWNER|ADMIN|MEMBER) is a membership and drives
  `@Permissions`/`@Roles`. `systemRole` (USER|MODERATOR|ADMIN) is platform
  standing and drives `@SystemRoles` only. A system role opens dedicated
  routes (`/admin/*`); it never widens an org-scoped route.
- **Param naming:** `:orgId` puts a route under `ActiveOrgGuard` (must equal
  the session org). `:id` is a plain resource id. Pick deliberately.
- **Every route validates through `@ZodRequest(Schema)`** — body, query and
  params in one schema, path winning. No-input routes use the strict
  `EmptyRequestSchema`. Never raw `@Param`/`@Query`/`@Body`.
- **Routes are denied by default.** No `@Permissions`/`@Roles`/`@SystemRoles`
  and no `@PublicRoute` → 403.
- **Every tenant query is org-scoped, and the boundary gets a test.** New
  repository methods take `orgId` and join on it; add a two-tenant
  integration test that proves reads and writes stay inside. Two real
  cross-tenant bugs were found exactly this way.
- **A permission no route reads gets deleted, not kept.** Dead entries in
  `ROLE_PERMISSIONS` read as protection and provide none.
- **Frontends must not bundle Zod.** Web and mobile alias `@pkg/contracts` to
  its `/client` entry (types + constants + permissions only). Runtime
  constants go in `contracts/src/constants/`, not schema files.
- **Errors carry translation keys, not sentences:**
  `throw new ForbiddenException(k.orgs.errors.notFound)`. Keys live in
  `@pkg/locales` and every language must translate them (a test enforces it).

## Commands

```bash
pnpm dev                     # everything
pnpm --filter @pkg/api dev   # one workspace (names are @pkg/*, incl. apps)
pnpm db:migrate              # after building @pkg/database
pnpm db:seed                 # NODE_ENV picks the strategy
```

Local integration testing: Postgres on 127.0.0.1:5432, then
`DATABASE_URL=postgresql://valmatic:valmatic@127.0.0.1:5432/valmatic_test pnpm verify`.

## Commits

Conventional commits, enforced by commitlint; scopes derive from the
directories under `apps/` and `packages/`. Branch per change, PR to `main`.
