# `apps/api`

The HTTP API. Thin on top of `@pkg/server`, which supplies auth, guards,
logging, health and queue producers — this app owns the features.

## Layout

```
src/
├── auth/           login, tokens, password change, OrgAccessProvider
├── user/           users within an organization
├── org/            organizations, switching
├── notifications/  the user's notification feed
├── jobs/           enqueues work for apps/worker
├── i18n/           request-scoped translation
├── seed/           first-run data
├── config/         Zod-validated env
└── main.ts
```

Routes are prefixed `/api`, except `/health`.

## A feature module

Four files, one job each:

```
user/
├── user.controller.ts   HTTP, permissions, validation
├── user.service.ts      business rules, throws, logs
├── user.repository.ts   database access
└── user.module.ts
```

```ts
@Post()
@Permissions('user:create')
async create(
  @ZodRequest(CreateUserRequestSchema) dto: CreateUserRequest,
  @ActiveUser() activeUser: ActiveUserType,
): Promise<CreateUserResponse> {
  return this.userService.createUser(activeUser, dto);
}
```

The controller does no work: it declares the permission, validates the body,
and hands the active user plus a typed DTO to the service. Rules — who may do
what to whom — live in the service. SQL lives in the repository.

Use `@ZodRequest(Schema)` for everything — it validates body, query string and
path params together against one schema, with path segments winning over the
payload. No route reads `@Param`, `@Query` or `@Body` raw; routes that take no
input still validate against the strict `EmptyRequestSchema`, so unexpected
input is rejected rather than silently discarded.

One param name is load-bearing: **`:orgId` puts a route under `ActiveOrgGuard`**,
which forces it to equal the session's organization (update an org). **`:id` is
a plain resource id**, authorised on its own terms (read an org you belong to).
Pick deliberately.

## Every query is scoped to the organization

This is the security property the whole app rests on. `activeUser.orgId` comes
from the verified token, and repository methods take it:

```ts
findUsersInOrg(orgId, …)
findUserInOrg(userId, orgId)
removeUserFromOrg(userId, orgId)
```

They filter by joining `organizationUser` on `orgId`, so a row belonging to
another tenant cannot come back.

**The convention is now backed by tests that run against a real database.**
Each repository has an integration suite (`describeIntegration`, runs when
`DATABASE_URL` is set — locally and in CI) that creates two organizations and
proves reads and writes stay inside the one asked for. This is not theoretical
cover: the user module's suite caught a real cross-tenant write on its first
run, and the notification module shipped for months filtering by user alone.
When adding a repository method, take `orgId`, join on it, and add the
two-tenant test — or be able to say precisely why the query is safe without
one.

The one deliberate exception: `/admin/orgs` (`AdminOrgController`) is
cross-tenant **by design** — it lists and deletes any organization, gated by
`@SystemRoles(SystemRole.ADMIN)`, the platform role. Organization users,
including OWNERs, cannot delete organizations at all.

`deleteUser(userId)` is the exception and shows the shape of a safe one: the
service first proves membership with `findUserInOrg`, removes the user from the
organization, and only deletes the account once `countUserOrgs` reaches zero.

## Auth

`@pkg/server` owns authentication; this app supplies the part that needs the
database. `OrgAccessProvider` implements `IOrgAccessProvider` and answers "does
this user belong to this org, and as what role" — so the guards stay in the
shared package while the query lives here.

Routes are protected by default. `@PublicRoute()` opts out; login and register
are the only ones that do — and register is additionally CLOSED by default
(`AUTH_REGISTRATION_ENABLED=false`): accounts come from the seed, from org
admins via `user:create`, or from a product's own onboarding. Login and
register sit behind strict per-IP rate limits declared AT the routes
(`@Throttle`); everything else gets a generous Redis-backed default budget per
verified user. `@SkipThrottle()` opts a route out — health does. Volumetric
floods are the edge's job, not Node's: see `docs/edge-protection.md`.

Service errors are Nest exceptions carrying **translation keys**, not sentences:

```ts
throw new ForbiddenException(k.users.errors.cannotRemoveSelf);
```

## Adding a feature

1. `src/thing/` with controller, service, repository and module.
2. Schemas and permissions go in `@pkg/contracts` first — the client needs them.
   A permission no route reads gets deleted, not kept: a table entry that gates
   nothing reads as protection and provides none.
3. Guard every route with `@Permissions(...)` — or `@SystemRoles(...)` for a
   platform surface. A route with neither is refused by default.
4. Identity comes from `@ActiveUser`, never the payload: `userId` and `orgId`
   ride the session token into services, repositories and job payloads.
5. Take `activeUser.orgId` through to the repository, and prove the boundary
   with a two-tenant integration test.
6. Register the module in `app.module.ts`.

## Seeding

`pnpm db:seed` picks a strategy from `NODE_ENV`: production seeds one owner and
one organization, development adds demo users from
`src/seed/data/users.json`. Force it with `SEED_STRATEGY=production|development`.

## Testing

Two layers, one per kind of failure ([`@pkg/testing`](../../packages/testing/README.md)
is the guide):

- **Service tests** (`__tests__/*/**.service.test.ts`) — business rules over a
  faked repository. Fast, always run.
- **Repository integration tests** (`*.repository.test.ts`, via
  `describeIntegration`) — the queries against a real Postgres. They run only
  when `DATABASE_URL` is set and **skip silently otherwise**, so a green run
  without a database proves less than it looks. CI always sets one.

The split earns its keep: the service tests asserted the repository was
*called* with an org while the query ignored it — only the integration layer
caught the cross-tenant write.

## Commands

```bash
pnpm dev --filter @pkg/api
pnpm --filter @pkg/api test
DATABASE_URL=postgresql://… pnpm --filter @pkg/api test   # + integration
pnpm db:seed
```

Postgres and Redis must be running — `docker compose up -d` at the root.
