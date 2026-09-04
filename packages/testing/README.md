# `@pkg/testing`

Fakes and helpers for the workspace's tests, plus the conventions for the
tools around them. The default path touches no clock, network or database,
which is what keeps `pnpm verify` fast and lets several suites — or several
agents in worktrees — run at once without tripping over each other.

Import it as a dev dependency wherever you write tests.

## The stack

| Tool                       | For                                       | Where                  |
| -------------------------- | ----------------------------------------- | ---------------------- |
| **vitest**                 | the runner, `expect`, mocks, fake timers  | every workspace        |
| **@pkg/vitest-config**     | shared config; aliases `@pkg/*` to source | every workspace        |
| **@pkg/testing**           | the fakes and helpers below               | wherever you need them |
| **fast-check**             | property tests — generated inputs         | pure functions         |
| **msw**                    | HTTP interception                         | web                    |
| **@nestjs/testing**        | `Test.createTestingModule` for DI         | api, worker, server    |
| **@testing-library/react** | rendering and queries                     | web                    |
| **@playwright/test**       | end-to-end, real browser                  | `apps/e2e` only        |

All versions are catalog-managed in `pnpm-workspace.yaml`.

## Which kind of test

| Question                                                               | Test                                                        |
| ---------------------------------------------------------------------- | ----------------------------------------------------------- |
| Does this function do the right thing?                                 | unit — vitest, in the workspace                             |
| Does it hold for any input?                                            | property — fast-check                                       |
| Does this service behave with its collaborators?                       | `Test.createTestingModule` + fakes                          |
| Does the SQL work?                                                     | `describeIntegration`                                       |
| Does Nest still run our guards, filters and plugins on a real request? | `describeStack` — the app booted in-process, `app.inject()` |
| Does the screen render and respond?                                    | testing-library + msw, in `apps/web`                        |
| Does the whole stack work end to end?                                  | Playwright, in `apps/e2e`                                   |

Reach for the cheapest one that can answer the question. A rule about a pure
function is a unit test, not a browser starting up.

Playwright covers what nothing else can: real browser, real API, real database,
real cookies — login, redirects, and permission-gated screens as a user meets
them. It is not the place to check validation rules or business logic; that is
a unit test that runs in milliseconds instead of a minute.

It stays out of `pnpm verify` deliberately — slow, needs ports and a database,
and parallel runs collide. It runs as its own step (`pnpm e2e`, or
`pnpm e2e:docker` for the containerised stack), while `verify` stays fast enough
to run after every change. See `apps/e2e` for writing and debugging specs.

## Stack tests — the layer mocks cannot cover

Guard and filter unit tests hand-build their `ExecutionContext`, so they pass
whether or not the framework still invokes them. `describeStack` suites boot
the real app in-process (`apps/api/__tests__/pipeline/`) through the same
factory production uses and drive it with `app.inject()` — no listener, no
browser. They run when `DATABASE_URL` and `IAM_REDIS_HOST` are both set and
skip otherwise, like `describeIntegration`. This is the before/after baseline
for a framework upgrade: run it green on the old version first.

## Property tests

`fast-check` generates ~100 inputs per property, biased toward boundaries,
instead of the handful you would think to write:

```ts
fc.assert(
  fc.property(fc.integer({ min: 1, max: 65535 }), (port) => {
    expect(validateEnv({ REDIS_PORT: String(port) }).REDIS_PORT).toBe(port);
  }),
);
```

Worth it for **pure functions with an always/never rule** — parsers, validators,
encoders, maths. `apps/worker/__tests__/config/env.property.test.ts` is the
worked example; it found a schema that accepted `"A:"` as a database URL.

Not worth it for anything doing I/O: 100 runs against a database is 100 round
trips. Cap it with `{ numRuns: 20 }` where a property is expensive.

## What's in it

| Export                         | Use it for                                                                       |
| ------------------------------ | -------------------------------------------------------------------------------- |
| `FakeLogger`                   | pino logger that records instead of printing                                     |
| `describeIntegration`          | a suite that needs a real database                                               |
| `describeStack`                | a suite that boots the whole app — needs a database AND Redis (`IAM_REDIS_HOST`) |
| `truncate`                     | empty tables between integration tests                                           |
| `loadFixture` / `expectGolden` | pin recorded input and exact output                                              |

## FakeLogger

Shaped to `PinoLogger`, which is what `@InjectLogger()` provides:

```ts
const logger = new FakeLogger();
const provider = new LocalAuthProvider(redis, logger.as<PinoLogger>());

expect(logger.logged('token expired', 'warn')).toBe(true);
```

`PinoLogger` has private members no structural fake can satisfy, so `.as<T>()`
holds the one cast rather than leaving `as unknown as PinoLogger` in every test.

`logged()` searches logged objects too, since pino is called as
`logger.warn({ err }, 'message')`.

## Time — use vitest, not a fake

There is no fake clock. Nothing takes an injected one — production code calls
`Date.now()` directly in a dozen places — so a clock you must inject would
require rewriting each call site. Vitest patches the global instead:

```ts
vi.useFakeTimers();
vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
await vi.advanceTimersByTimeAsync(5 * 60_000);
vi.useRealTimers();
```

`health.service.test.ts` uses this to prove a hanging probe times out.

## HTTP — use MSW, not a fake

There is deliberately no fake HTTP client here. Code calls axios directly, so a
client you have to inject would only work if every call site were rewritten to
accept one. MSW intercepts at the network layer instead, which works with axios,
`fetch`, or anything else, and leaves production code untouched.

`apps/web/__tests__/mocks/` has it wired: handlers in `handlers.ts`, the server
in `server.ts`, started in `setup.ts` with `onUnhandledRequest: 'error'` — so a
request nobody stubbed fails the test rather than silently hitting the network.

```ts
server.use(http.get('/api/users', () => HttpResponse.json({ users: [] })));
```

Override per test with `server.use(...)`; `setup.ts` resets handlers after each.

## Database tests

```ts
describeIntegration('UserRepository', () => {
  beforeEach(() => truncate(db, [organizationUser, user]));
  it('persists a user', async () => { … });
});
```

Runs when `DATABASE_URL` is set, **skips** when it is not — so a fresh clone, a
CI checkout, or an agent in a worktree all pass without Postgres running, while
the same suite exercises real SQL wherever a database exists.

Pass tables to `truncate` children-first; tests that leak rows into each other
fail in order-dependent ways that are miserable to debug.

## Goldens

```ts
expectGolden('reports/monthly.json', result);
```

Writes the file on first run, compares against it afterwards. This is the cheap
guard against **silent behaviour drift** — pin anything whose exact output
matters and a refactor that changes it fails loudly.

`UPDATE_GOLDENS=1 pnpm test` rewrites them. Read the diff before accepting it: a
golden refreshed without being read just records the bug.

Fixtures are recorded input — `loadFixture('signals/june.json')` reads from
`__tests__/__fixtures__/`, goldens live in `__tests__/__goldens__/`.

## Adding a fake

It belongs here only when code **actually takes it as a dependency**. A fake for
something nothing injects is unusable — the HTTP client and clock that used to
live here were exactly that, and MSW and `vi.useFakeTimers()` do those jobs by
patching instead. Check the call sites first.

Fakes for your own domain objects belong in the workspace that owns them.

Keep it dependency-free beyond `vitest`, and give it a test: a broken fake makes
every suite that uses it lie.
