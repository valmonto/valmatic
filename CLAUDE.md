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

## Agent tooling — you have eyes

`.mcp.json` gives every session in this repo browser control (Playwright MCP:
navigate, click, type, screenshot, accessibility snapshot). **UI work is not
done until you have looked at it**: boot the stack, log in, drive the flow you
built, and compare what renders against the spec.

- **Debug artifacts go under `.debug/`, never the repo root.** Playwright MCP
  is pointed at `.debug/playwright` (via `--output-dir` in `.mcp.json`), so
  screenshots, `page-*.yml` snapshots and console logs land there. `.debug/`
  and `.playwright-mcp/` are gitignored and ephemeral — do not `git add` them.
  The **durable** evidence for a task is the **ticket attachment**, not a file
  committed to the repo.
- Dev logins come from the seed: `admin@valmonto.com` (platform admin),
  `member@valmonto.com`, … — password `ChangeMe123!` unless
  `SEED_INITIAL_PASSWORD` overrides it.
- Mobile UI: run `expo start --web` and verify at a phone viewport — Expo
  renders in the browser, which covers layout, flows and navigation. A native
  Android/iOS emulator layer (mobile-mcp / Maestro) is deliberately NOT wired;
  add it when a ticket needs native-only behaviour (push, haptics, camera).

## Definition of done

```bash
pnpm verify            # typecheck + lint + test — must exit 0 (authoritative gate)
pnpm verify:affected   # local fast check — only workspaces changed since main + dependents
```

**`pnpm verify` is the authoritative gate.** CI runs the full verify — every
package typechecked + linted + tested against Postgres — on every PR, and that
run is what clears a merge. It must exit 0.

**`pnpm verify:affected` is a local fast-feedback tool, not a gate.** It runs
typecheck/lint/test only for the workspaces that changed since `origin/main`
plus everything downstream of them (`scripts/verify/affected.mjs`), and skips
the database when no DB-backed suite (api/worker/testing) is in scope. A leaf
`apps/web`-only change runs just web; the full suite runs the whole graph. Use
it to iterate quickly — CI's full verify still catches anything scoping misses,
so nothing merges unverified. (It resolves the affected graph from `git diff`
rather than pnpm's `--filter "...[main]"`, which returns nothing inside a linked
git worktree — where build agents run.)

**Escalate to the full `pnpm verify` locally when a shared package changes.** A
change to `@pkg/contracts`/`database`/`server`/`locales` fans out to api/worker
(so `verify:affected` reports the DB is needed and warns) — run the full gate
with a database for real confidence before pushing:

```bash
DATABASE_URL=postgresql://valmatic:valmatic@127.0.0.1:5432/valmatic_test pnpm verify
```

Done also means the documentation still tells the truth: **if a change
falsifies a claim in a README (or this file, or `GAPS.md`), fix that claim in
the same PR.** Stale docs are worse than none — they carry authority while
teaching the old behaviour. This has already happened once: an entire
hardening pass shipped while `apps/api/README.md` kept saying tenancy had no
test coverage.

Integration tests (`describeIntegration`) run only when `DATABASE_URL` is set;
without a database they skip silently, so a green run proves less. CI sets one.
The in-process pipeline suite (`describeStack`, `apps/api/__tests__/pipeline`)
additionally needs `IAM_REDIS_HOST`; CI provides a Redis service for it.
The test step is serialized on purpose (api and worker suites share the test
database) — do not re-parallelize it without giving each suite its own database.

## Conventions that are load-bearing everywhere

Workspace-specific rules live in each workspace's own `CLAUDE.md` — only what
spans the whole repo belongs here.

- **Identity comes from the session, never the payload.** `@ActiveUser()`
  supplies `{ userId, orgId, orgRole, systemRole }`; request schemas carry no
  identity fields. Job payloads are attributed from the session too.
- **Two role axes, both enums contain `ADMIN` — never conflate them.**
  `orgRole` (OWNER|ADMIN|MEMBER) is a membership and drives
  `@Permissions`/`@Roles`. `systemRole` (USER|MODERATOR|ADMIN) is platform
  standing and drives `@SystemRoles` only. A system role opens dedicated
  routes (`/admin/*`); it never widens an org-scoped route.
- **Relative imports inside `packages/*` carry a `.js` suffix** (`./x.js`,
  `./dir/index.js`). The packages are ESM under NodeNext resolution; the
  suffix is the compiled name and tooling maps it to the `.ts` source. The
  apps are CommonJS-format and need none. See `packages/tsconfig/README.md`.
- **Dependency versions live in the `pnpm-workspace.yaml` catalog.** Never
  `pnpm add` a version into a package.json directly — add an exact pin to the
  catalog section it belongs to and reference it as `catalog:`.
- **Every tenant query is org-scoped, and the boundary gets a test.** New
  repository methods take `orgId` and join on it; add a two-tenant
  integration test that proves reads and writes stay inside. Two real
  cross-tenant bugs were found exactly this way.

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

## Working with the human operator (agent conduct)

Applies to any coding agent (including the specbook runner) acting on this repo. The
**canonical copy lives in the valmatic template** — keep these in sync; derivatives do not
auto-inherit template changes, so this block is copied into each repo on purpose.

- **Act on an explicit instruction — don't hand it back.** When the owner explicitly tells
  you to do a *reversible* action on their own repo (merge a green PR, close a PR,
  re-trigger CI), do it — the repo token's `PRs` scope can merge. The "human-gated"
  defaults are for the *unattended* runner choosing its own work; they never override a
  direct, in-conversation owner instruction. (Genuinely irreversible/destructive actions
  still get confirmed first.)
- **The user's ground truth beats a blind API.** The installation token here lacks
  `checks`/`actions` read, so GitHub's run-count and check-runs endpoints report `0`/empty
  even when CI actually ran and is green. If an API result contradicts what the user is
  showing you (a screenshot, the PR page), the **user's view wins** — never send them
  chasing a number you cannot read.
- **Do, don't narrate.** Prefer performing the next concrete step over describing status.
