# `@pkg/utils`

Framework-agnostic helpers shared by every app. No dependencies, no Zod, nothing
Node-specific — safe to import from the API, the browser and React Native alike.

## Layout

```
src/
├── try-catch.ts   tryCatch — promise → Result
└── index.ts
```

## `tryCatch`

Turns a rejected promise into a value, so a failure that should not abort the
request is handled inline instead of through a `try/catch` block that swallows
the rest of the function with it.

```ts
const { d, e } = await tryCatch(iamService.auth.revokeToken({ token }));
if (e) logger.warn({ err: e }, 'Failed to revoke token during logout');
// carry on — logout still clears cookies
```

`d` is the data, `e` the error. The return type is a discriminated union, so
checking one narrows the other:

```ts
type Result<T, E = Error> = { d: T; e: null } | { d: null; e: E };
```

Pass the error type when you need it: `tryCatch<User, ApiError>(promise)`.

**It unwraps Drizzle errors.** When the thrown error carries a `cause.message`,
that message is prepended to the error's own — otherwise the useful part of an
ORM failure ("duplicate key value violates unique constraint …") stays buried in
`cause` while the top-level message says nothing.

Errors are returned, never thrown or logged. Deciding what a failure means is
the caller's job.

## When to use it

Use it where **failure is an expected branch** — a cleanup step that should not
fail the request, an action whose error you want to render rather than throw.

Skip it where you want the exception to propagate: a Nest controller throwing
`UnauthorizedException` should keep throwing, since the framework's exception
filter turns it into the right response.

The web and mobile `use-action-request` hooks wrap every action in it, which is
why a failed mutation renders an error instead of blanking the screen.

## Adding a helper

**Writing the same small function a second time? Put it here.** That is the
whole point of the package — `sleep`, `chunk`, `debounce`, `formatBytes` and
friends get copied between apps otherwise, and then fixed in only one of them.
The package staying at one helper is not a goal.

It belongs here when it is:

- **shared by at least two workspaces** — web + api, api + worker, web + mobile.
  Never something only one app uses
- **pure** — same input, same output; no Nest, no database, no `window`, no `fs`
- **dependency-free** — nothing new in `package.json`

The two-consumer rule is the one that matters. A helper only `apps/web` calls
lives in `apps/web/src/shared/`, where it can change freely; moving it here
makes it a shared contract, so every later edit has to be checked against apps
that never needed it. Promote it when the second consumer appears, not in
anticipation of one.

It also does not belong here when it needs a framework or a runtime: that goes
in `@pkg/server` (Nest, Node) or the app itself. This package is imported by the
API, the browser and React Native, so anything runtime-specific breaks one of
them.

The pattern:

```
src/sleep.ts            export function sleep(ms: number) { … }
src/index.ts            export { sleep } from './sleep';
__tests__/sleep.test.ts
```

One concern per file, named after it. Export explicitly rather than
`export *`, so `index.ts` reads as the public surface. Tests are not optional —
these functions are used everywhere, so a regression is a regression in every
app at once.
