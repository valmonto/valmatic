# `@pkg/server`

The shared NestJS layer — auth, guards, logging, queues, Redis, health, and the
request/error plumbing. `apps/api` and `apps/worker` are thin on top of it.

## Layout

```
src/
├── common/     ZodRequest, GlobalExceptionFilter
├── config/     SECURITY_CONFIG, cookie options
└── modules/    iam · health · logging · queues · redis · events
```

| Module | What it gives you |
|---|---|
| `iam` | auth providers, the global guards, the decorators below |
| `health` | `/health` — probes Postgres and Redis, 503 when either is down |
| `logging` | pino; `@InjectLogger()` |
| `queues` | BullMQ — api enqueues, worker consumes |
| `redis` | one shared client behind the `REDIS` token, `@Global` |
| `events` | in-process emitter; use a queue if it must survive a restart |

## Writing a route

```ts
@Permissions('user:create')
@Post()
create(@ZodRequest(CreateUserRequestSchema) dto: CreateUserRequest, @ActiveUser() user: ActiveUserType) {}
```

| | |
|---|---|
| `@PublicRoute()` | skip authentication |
| `@Permissions('user:create')` | require a permission from `@pkg/contracts` |
| `@Roles('OWNER')` | require an org role |
| `@SystemRoles('ADMIN')` | require a platform role, independent of any org |
| `@ActiveUser()` | inject the authenticated user |
| `@ZodRequest(Schema)` | validate the body; 400 with field errors |

## Four things to know

**Routes are protected by default.** The guards are `APP_GUARD`s, so an endpoint
without `@PublicRoute()` requires a valid token. A route carrying none of
`@Roles`, `@Permissions` or `@SystemRoles` is refused rather than exposed.

**There are two role axes, and both enums contain `ADMIN`.** `orgRole`
(`OWNER|ADMIN|MEMBER`) is a membership and decides what you may do inside the
active organization. `systemRole` (`USER|MODERATOR|ADMIN`) belongs to the
account and decides nothing inside one. `@Roles` and `@Permissions` read the
first, `@SystemRoles` the second — never each other's.

A system role opens *dedicated* routes; it never widens an organization-scoped
one. Every tenant route stays scoped to the caller's active organization
whatever their platform standing, so there is one code path to reason about
rather than two.

**Guard order is load-bearing.** `AuthGuard` resolves the user before
`RolesGuard`, `PermissionsGuard` and `SystemRolesGuard` judge them. Reordering
them in `auth.provider.module.ts` breaks authorization silently.

**Auth is swappable.** `LocalAuthProvider` (JWT + Redis) is bound to the
`AUTH_PROVIDER` token; moving to a hosted provider is one class and one binding.
Redis is required either way — blacklists, log-out-everywhere and login lockout
live there, so a revoked token is refused by every replica.

## Errors

Throw Nest exceptions; `GlobalExceptionFilter` gives them one response shape and
logs 5xx. Messages are **translation keys**, not sentences — see `@pkg/locales`.

## Adding to this package

Put it here when both services need it, or a second plausibly would — guards,
filters, decorators, transport. Feature logic stays in the app: this package
owns *that requests are authenticated*, `apps/api/src/user/` owns users.

```
modules/thing/
├── thing.module.ts
├── thing.service.ts
└── index.ts
```

Export through the module's `index.ts`, add it to `modules/index.ts`, and import
from `@pkg/server` — never a deep path.

Nest-specific code only; anything framework-free belongs in `@pkg/utils`.

## Testing

The guard chain is the most heavily tested surface in the repo (113 tests) —
each guard has a suite, and the token provider's refresh path asserts both
roles are re-read from the database, so a demotion cannot outlive the access
token. Guards are plain classes: construct them with a stubbed `Reflector`,
no Nest testing module needed. See
[`@pkg/testing`](../testing/README.md) for the shared tools.
