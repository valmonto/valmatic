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
| No error tracking                                         | Wired and sleeping: `ErrorReporter` reports api/worker 5xx (with user, org, route) when `SENTRY_DSN` is set; PostHog captures web exceptions when its key is set. Enabling per product is one env var                                    |
| No security headers                                       | `@fastify/helmet` on the api (CSP off — JSON API; CORP cross-origin so the SPA can consume responses)                                                                                                                                  |
| No IP rate limiting                                       | Redis-backed `@nestjs/throttler`: per-route `@Throttle` decorators (login/register strict per IP, closing the cross-email spray), a global budget keyed by VERIFIED userId (carrier-NAT safe), `@SkipThrottle` on health, off under test |
| `ROLE_PERMISSIONS` untested                               | Invariant tests in `packages/contracts`: no orphan permissions, MEMBER ⊆ ADMIN ⊆ OWNER, every role holds the self-service core; helpers degrade an unknown (stale-JWT) role to 403 instead of crashing the guard                        |
| Open self-registration                                    | Closed by default (`AUTH_REGISTRATION_ENABLED=false`): accounts come from the seed, org admins, or a product's own onboarding. Server enforces; clients hide the page                                                                   |
| Feature flags                                             | Shipped: resolved server-side (PostHog when configured, all-off otherwise), delivered in `/auth/me` as `features` beside `permissions`, read via `useFeature()` on web and mobile                                                       |

---

## 1. Blocking — fix before this ships anything real

Nothing currently. Error tracking, security headers, rate limiting and the
registration posture all closed above; the next most consequential items are
the tests in section 2.

---

## 2. High — the tests that would catch real regressions

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
| **2FA / SSO**          | expected by any business customer                                                             | ~1w        |

Password reset is the one users notice first; email sending unblocks it and
verification both.

---

## Suggested order

1. **Admin UI + Bull Board** — the `@SystemRoles` gate is built; give it a screen
2. **E2E in CI** — ~2h
3. Then features, starting with email → password reset → verification
