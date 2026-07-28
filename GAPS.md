# Gaps

What is missing from valmatic, what it would cost, and what it buys. Compiled
from an audit of every package and app on 2026-07-31.

Ordered by consequence, not by effort. Nothing here is broken today — these are
the things that bite later, and the reasons they bite.

---

## 1. Blocking — fix before this ships anything real

### Multi-tenancy is convention, not enforcement

Every repository method takes `orgId` and joins `organizationUser` on it, and
every one does so correctly today. Nothing enforces it. A future
`findAllUsers()` without the filter returns every tenant's rows, and **no test
would fail**.

For a multi-tenant boilerplate this is the highest-consequence gap there is: the
failure is silent, and the blast radius is every customer's data.

| Option | Catches | Cost |
|---|---|---|
| Cross-tenant integration test — two orgs, assert every list/read returns only your own | a forgotten filter, at CI | ~1h |
| Scoped repository helper that requires `orgId` | forgetting structurally | ~1d, still bypassable |
| Postgres row-level security | everything, including raw SQL | ~2–3d, structural |

**Value:** the test alone converts "we are careful" into "CI fails if we are
not." That is the whole difference.

### No error tracking

Production errors reach the logs and stop there. Nobody is told, nothing is
aggregated, and a 500 that happens to one customer at 3am is invisible until
they complain.

**Cost:** ~2h for Sentry in api, worker and web.
**Value:** you learn about breakage from the tool rather than the customer, and
a stack trace with request context beats grepping logs.

### No security headers

The API sets CORS and nothing else — no CSP, HSTS, X-Frame-Options or
`nosniff`. `docs/legacy/docs/spa-deployment-config.md` covers headers for the
SPA at the reverse proxy, but the API itself is bare.

**Cost:** ~1h (`@fastify/helmet`).
**Value:** removes a class of clickjacking and content-sniffing findings that
any security review or customer questionnaire will raise.

### No IP rate limiting

Login lockout exists but is **per email** (10 attempts, 15-minute lockout).
Credential stuffing across many emails from one address is unthrottled, and
every other endpoint has no limit at all.

**Cost:** ~2h (`@fastify/rate-limit`, Redis-backed).
**Value:** closes the spray attack the per-email lockout does not see, and
protects expensive endpoints from a single noisy client.

---

## 2. High — the tests that would catch real regressions

Coverage by workspace, source files to test files:

| Workspace | Source | Tests | Notes |
|---|---|---|---|
| `apps/api` | 37 | 1 | **auth, user, org, notification services untested** |
| `apps/web` | 145 | 3 | button, a hook, a store — no feature tested |
| `apps/mobile` | 133 | 0 | none at all |
| `packages/contracts` | 17 | 0 | schemas and permissions untested |
| `packages/database` | 13 | 0 | no repository tests |
| `packages/server` | 52 | 9 | the best covered |
| `apps/worker` | 9 | 5 | queue pattern fully demonstrated |

### `apps/api` service tests

All the business rules live here — who may remove whom, owner protection,
self-removal, org scoping — and one file is tested. These are pure decisions
over injected repositories, so they are cheap to test with fakes.

**Cost:** ~1d for the four services.
**Value:** the rules that decide access are the ones you least want to refactor
blind.

### `packages/contracts` permission tests

`ROLE_PERMISSIONS` is a hand-maintained table with no inheritance. A permission
added to `PERMISSIONS` but forgotten in a role is silently denied.

**Cost:** ~1h.
**Value:** an OWNER quietly losing an ability is the kind of bug found in
production by a confused customer.

### Integration tests never run

`describeIntegration` skips without `DATABASE_URL`, and **CI never sets one** —
so the repository tests written for the worker have never executed anywhere.

**Cost:** ~1h (a Postgres service in `verify.yml`).
**Value:** the SQL layer is currently unverified by any automated run.

### E2E never runs in CI

Four Playwright specs exist. `verify.yml` and `deploy.yml` do not invoke them,
so nothing checks that login works before a deploy.

**Cost:** ~2h (a job using `compose.e2e.yml`).
**Value:** catches "the app boots but nobody can log in", which the health check
cannot see.

### The golden harness is unused

`expectGolden` was built and tested; no golden exists in the repo. It is the
cheapest guard against silent output drift and currently guards nothing.

---

## 3. Medium — operability

### No queue observability

No way to see queue depth, failure counts, or retry storms. A backed-up queue is
invisible until someone notices work is not happening.

**Cost:** ~3h (Bull Board behind an admin permission).
**Value:** turns "jobs feel slow" into a number.

### Only `api` has a container healthcheck

`compose.staging.yml` defines healthchecks for postgres, redis and api. **`web`
and `worker` have none**, so `--wait` only confirms they are *running* — a
crash-looping worker still reports a green deploy.

**Cost:** ~1h.
**Value:** completes the deploy gate that is already half-built.

### No rollback

`docker compose up -d --build` stops the old container before the new one proves
healthy. A bad deploy is downtime until someone pushes a fix.

**Cost:** ~1d for a blue/green or tagged-image rollback.
**Value:** turns a bad deploy from an outage into a revert.

### No API documentation

No OpenAPI or Swagger. Consumers read the controllers.

**Cost:** ~4h — and cheaper than usual, since Zod schemas already describe every
request and response.
**Value:** a contract non-TypeScript consumers can read, and a client generator.

---

## 4. Medium — developer and agent experience

### No `CLAUDE.md`

Every session re-derives the commands, structure and conventions. All of it is
now written in per-package READMEs, but nothing points an agent at them.

**Cost:** ~30m.
**Value:** the highest ratio in this document. Sessions start informed rather
than exploring, and `pnpm verify` becomes the stated definition of done.

### The repository has no README

The root README was archived to `docs/legacy/` and never replaced, so GitHub
shows no description. Every workspace is documented; the front door is not.

**Cost:** ~1h.
**Value:** orientation for anyone arriving, and the index that links the rest.

### Time is untestable

14 direct `Date.now()` / `new Date()` call sites. Anything time-dependent —
token expiry, lockout windows, retention — can only be tested by patching
globals, and never by injection.

**Cost:** ~4h for an injectable clock in the paths that matter.
**Value:** lockout and expiry logic becomes directly testable rather than
approximated.

### `apps/mobile` is outside lint

Excluded because the React Compiler rules produce ten false positives against
`react-native-reanimated`'s documented API. Reasonable — but roughly seven real
findings are excluded along with them.

**Cost:** ~2h to disable the incompatible rule specifically and fix the rest.
**Value:** 133 files rejoin the gate.

### Lint warnings

Six across `packages/database` (4), `apps/web` (1) and `apps/worker` (1). Small,
but warnings that live forever teach people to ignore the output.

---

## 5. Feature gaps — what a SaaS starter is expected to have

None of these exist. Each is a genuine build, listed so the shape of the
boilerplate is honest about what it is not.

| Missing | Why it matters | Rough cost |
|---|---|---|
| **Password reset** | there is no recovery from a forgotten password | ~1d |
| **Email sending** | no transport at all, which is why the above is missing | ~4h |
| **Email verification** | any address can register | ~4h |
| **Billing** | no Stripe, plans or subscriptions | ~1w |
| **File uploads** | no S3 or multipart handling | ~1d |
| **Audit log** | who changed what is unanswerable | ~1d |
| **Feature flags** | no way to ship dark | ~1d |
| **2FA / SSO** | expected by any business customer | ~1w |

Password reset is the one users notice first; email sending unblocks it and
verification both.

---

## Suggested order

1. **`CLAUDE.md`** — 30 minutes, makes every later session cheaper
2. **Cross-tenant test** — the highest-consequence gap, ~1h
3. **Postgres in CI** so integration tests actually run — ~1h
4. **Helmet + rate limiting** — ~3h together
5. **Sentry** — ~2h
6. **`apps/api` service tests** — ~1d
7. **Root README** — ~1h
8. Then features, by whatever the product needs first

The first five are roughly a day and remove every gap that fails silently.
