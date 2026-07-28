# `@pkg/testing`

Fakes and helpers so tests stay hermetic: no clock, no network, no database on
the default path. That is what keeps `pnpm verify` fast and lets several suites —
or several agents in worktrees — run at once without tripping over each other.

Import it as a dev dependency wherever you write tests.

## What's in it

| Export | Use it for |
|---|---|
| `FakeLogger` | pino logger that records instead of printing |
| `describeIntegration` | a suite that needs a real database |
| `truncate` | empty tables between integration tests |
| `loadFixture` / `expectGolden` | pin recorded input and exact output |

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
server.use(
  http.get('/api/users', () => HttpResponse.json({ users: [] })),
);
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
