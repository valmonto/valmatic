# Gaps

What is missing from valmatic, what it would cost, and what it buys. First
compiled from a full audit on 2026-07-06; revised 2026-07-30 after the module
hardening arc closed the original blocking section.

Ordered by consequence, not by effort.

---

## Closed since the audit

Kept here so the list stays honest about what changed and why.

| Was                                                       | Now                                                                                                                                                                                                                                     |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Multi-tenancy convention, no test would catch a leak      | Every repository has a two-tenant integration suite against real Postgres; `ActiveOrgGuard` enforces `:orgId` = session org. The suites caught two real leaks on their first runs (user cross-tenant write, account-wide notifications) |
| `apps/api` services untested (1 test file)                | auth, user, org, notifications, jobs covered — 107 tests                                                                                                                                                                                |
| Integration tests never ran anywhere                      | `verify.yml` runs Postgres + migrations; `describeIntegration` executes in CI and locally                                                                                                                                               |
| One ambiguous `role: z.string()` on the session           | Two named axes — `orgRole` (membership) and `systemRole` (platform), both strict enums, both re-read on token refresh; `@SystemRoles` + `/admin/orgs` consume the platform axis                                                         |
| Caller-supplied identity in job payloads                  | Jobs attributed to the session; payloads carry `userId` + `orgId` from `@ActiveUser`                                                                                                                                                    |
| Dead permissions (`org:delete`, `job:list/update/delete`) | Deleted. Standing rule: a permission no route reads gets removed, not kept                                                                                                                                                              |
| Test step flaked ~2 runs in 3                             | Serialized (`--workspace-concurrency=1`); do not re-parallelize without per-suite databases                                                                                                                                             |
| No `CLAUDE.md`, no root README                            | Both exist                                                                                                                                                                                                                              |

---

## 1. Blocking — fix before this ships anything real

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

### `packages/contracts` permission tests

`ROLE_PERMISSIONS` is a hand-maintained table with no inheritance. A permission
added to `PERMISSIONS` but forgotten in a role is silently denied.

**Cost:** ~1h.
**Value:** an OWNER quietly losing an ability is the kind of bug found in
production by a confused customer.

### Web and mobile feature tests

`apps/web`: 145 source files, 3 test files — no feature tested. `apps/mobile`:
133 files, none at all. The api-side rules are now covered; the client-side
rendering of them (permission gates, org switching, auth flows) is not.

**Cost:** ~1–2d for the critical paths.

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

**Cost:** ~3h (Bull Board behind `@SystemRoles(ADMIN)` — the gate exists now).
**Value:** turns "jobs feel slow" into a number.

### No admin UI

`/admin/orgs` (list all organizations, delete any) is API-only. A platform
admin manages tenants with curl. `useSystemRole()` exists on web and mobile
precisely to gate such a surface.

**Cost:** ~4h for a minimal web page.

### Only `api` has a container healthcheck

`compose.staging.yml` defines healthchecks for postgres, redis and api. **`web`
and `worker` have none**, so `--wait` only confirms they are _running_ — a
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

Seven across `packages/database` (4), `apps/web` (2) and `apps/worker` (1).
Small, but warnings that live forever teach people to ignore the output.

---

## 5. Feature gaps — what a SaaS starter is expected to have

None of these exist. Each is a genuine build, listed so the shape of the
boilerplate is honest about what it is not.

| Missing                | Why it matters                                                                                | Rough cost |
| ---------------------- | --------------------------------------------------------------------------------------------- | ---------- |
| **Password reset**     | there is no recovery from a forgotten password                                                | ~1d        |
| **Email sending**      | no transport at all, which is why the above is missing                                        | ~4h        |
| **Email verification** | any address can register                                                                      | ~4h        |
| **Billing**            | no Stripe, plans or subscriptions                                                             | ~1w        |
| **File uploads**       | no S3 or multipart handling                                                                   | ~1d        |
| **Audit log**          | who changed what is unanswerable                                                              | ~1d        |
| **Feature flags**      | no way to ship dark — planned as a `features` field beside `permissions`, never mixed into it | ~1d        |
| **2FA / SSO**          | expected by any business customer                                                             | ~1w        |

Password reset is the one users notice first; email sending unblocks it and
verification both.

---

## Suggested order

1. **Helmet + rate limiting** — ~3h together, the remaining silent-failure gaps
2. **Sentry** — ~2h
3. **Permission-table test** — ~1h
4. **Admin UI + Bull Board** — the `@SystemRoles` gate is built; give it a screen
5. **E2E in CI** — ~2h
6. Then features, starting with email → password reset → verification
