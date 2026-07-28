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
| `@ActiveUser()` | inject the authenticated user |
| `@ZodRequest(Schema)` | validate the body; 400 with field errors |

## Three things to know

**Routes are protected by default.** The guards are `APP_GUARD`s, so an endpoint
without `@PublicRoute()` requires a valid token.

**Guard order is load-bearing.** `AuthGuard` resolves the user before
`RolesGuard` and `PermissionsGuard` judge them. Reordering them in
`auth.provider.module.ts` breaks authorization silently.

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
