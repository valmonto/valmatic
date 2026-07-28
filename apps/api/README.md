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

Use `@ZodRequest(Schema)` for bodies. Query strings arrive as strings, so those
parse explicitly: `ListUsersRequestSchema.parse(query)`.

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

**This is convention, not enforcement.** Nothing stops a new `findAllUsers()`
without an org filter, and the result is a cross-tenant leak that no test
currently catches. When adding a repository method, take `orgId` and join on
it — or be able to say precisely why the query is safe without one.

`deleteUser(userId)` is the exception and shows the shape of a safe one: the
service first proves membership with `findUserInOrg`, removes the user from the
organization, and only deletes the account once `countUserOrgs` reaches zero.

## Auth

`@pkg/server` owns authentication; this app supplies the part that needs the
database. `OrgAccessProvider` implements `IOrgAccessProvider` and answers "does
this user belong to this org, and as what role" — so the guards stay in the
shared package while the query lives here.

Routes are protected by default. `@PublicRoute()` opts out; login and register
are the only ones that do.

Service errors are Nest exceptions carrying **translation keys**, not sentences:

```ts
throw new ForbiddenException(k.users.errors.cannotRemoveSelf);
```

## Adding a feature

1. `src/thing/` with controller, service, repository and module.
2. Schemas and permissions go in `@pkg/contracts` first — the client needs them.
3. Guard every route with `@Permissions(...)`.
4. Take `activeUser.orgId` through to the repository.
5. Register the module in `app.module.ts`.

## Seeding

`pnpm db:seed` picks a strategy from `NODE_ENV`: production seeds one owner and
one organization, development adds demo users from
`src/seed/data/users.json`. Force it with `SEED_STRATEGY=production|development`.

## Commands

```bash
pnpm dev --filter @pkg/api
pnpm --filter @pkg/api test
pnpm db:seed
```

Postgres and Redis must be running — `docker compose up -d` at the root.
