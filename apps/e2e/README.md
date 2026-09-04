# `apps/e2e`

Playwright tests against a running stack — real browser, real API, real
database. Covers what unit tests cannot: login, redirects, cookies, and whether
a protected route is actually protected.

Not part of `pnpm verify`. It runs as its own step, because it is slow, needs
ports and a database, and parallel runs collide.

## Running

```bash
pnpm e2e            # headless; starts the web dev server if one is not running
pnpm e2e:ui         # Playwright UI — the best way to debug
pnpm e2e:headed     # visible browser
pnpm e2e:debug      # step through with the inspector
pnpm e2e:report     # open the last HTML report
```

Local runs expect the **API and database to be up** (`docker compose up -d`);
Playwright only starts the web dev server itself, reusing one already listening
on `:5173`.

```bash
pnpm e2e:docker     # everything containerised — postgres, redis, api, web, tests
```

The Docker path builds the web app for production (`web.Dockerfile` → nginx)
and runs the suite against it, so it exercises the built bundle rather than the
dev server. That is what CI uses.

## The specs

| Spec               | Covers                                                 |
| ------------------ | ------------------------------------------------------ |
| `smoke`            | the app loads, no console errors, 404 works            |
| `auth`             | login and register pages render and link to each other |
| `authorization`    | the API returns 401 without a token                    |
| `authorization-ui` | protected routes redirect to login                     |

`authorization.spec.ts` uses Playwright's `request` fixture rather than a
browser — checking the API directly is faster and does not need a page. Reach
for `page` only when the browser is the point.

## It is deliberately slow

`slowMo: 500` puts half a second between actions, and traces and video are
recorded for every run, not just failures. That is a debugging trade: a failed
CI run comes with a video and a trace you can step through, which is worth more
than a fast suite you cannot diagnose. Do not "fix" the slowness without
replacing what it buys.

CI also runs **serially** (`workers: 1`) with 2 retries, despite
`fullyParallel: true` locally — the tests share one database, so parallel
workers would fight over the same rows.

## Writing a test

Tests share a database and may run in any order. Two rules follow:

- **Do not depend on another test's state.** Create what you need, or assert
  against seeded data that always exists.
- **Do not assume you are alone.** Unique emails (`user-${Date.now()}@…`) beat
  fixed ones that collide on a rerun.

Prefer role- and text-based locators (`getByRole('button', { name: 'Sign in' })`)
over CSS selectors — they survive restyling, and they fail for the right reason
when a control loses its accessible name.

## What belongs here

Only flows that need the whole stack: authentication, redirects, permissions as
a user meets them, anything involving cookies or navigation.

Validation rules, business logic and component behaviour do **not** — those are
unit tests that run in milliseconds. A rule tested through a browser is a rule
tested slowly, flakily, and a long way from the code it describes.
