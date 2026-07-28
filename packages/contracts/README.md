# `@pkg/contracts`

Shared API contract — Zod schemas, their inferred types, and the permission
model. API, web and mobile all import from here, so a shape change is a compile
error everywhere instead of a runtime surprise. Only dependency: `zod`.

## Layout

```
src/
├── schemas/      auth · user · organization · iam · jobs · notification · pagination
├── types/        export type * from schemas — no runtime
├── constants/    iam.ts (password rules, role enums) — Zod-free
├── permissions/  list · roles · helpers — Zod-free
├── client/       frontend entry: types + constants + permissions
└── index.ts      full barrel — server side
```

`schemas/` and `constants/` split **by domain, not by kind** — when jobs needs a
runtime constant it gets `constants/jobs.ts`, rather than one file becoming a
junk drawer.

## Entry points

| Import | Contains | Zod | Built size |
|---|---|---|---|
| `@pkg/contracts` | server: everything | yes | — |
| `@pkg/contracts/client` | types + constants + permissions | **no** | 465 B |
| `@pkg/contracts/types` | types only | no | 11 B |
| `@pkg/contracts/constants` | password rules, role enums | no | 1.0 kB |
| `@pkg/contracts/permissions` | catalogue, role table, checks | no | 2.8 kB |
| `@pkg/contracts/schemas` | the Zod schemas | yes | 11.4 kB |

**Web and mobile alias `@pkg/contracts` to `/client`** (`vite.config.ts`,
`metro.config.js`). So in frontend code the bare specifier is already the safe
one — reaching a schema by accident fails to build rather than quietly adding
Zod and the whole schema graph to the bundle.

Frontend code that genuinely re-validates imports `@pkg/contracts/schemas`
explicitly, which shows up in review instead of happening by accident.

## Conventions

Every schema exports the schema **and** its inferred type — never hand-write the
type, it drifts.

```ts
export const OrgUserSchema = z.object({ id: z.string().uuid() });
export type OrgUser = z.infer<typeof OrgUserSchema>;
```

Name request/response pairs after the operation: `CreateUserRequestSchema` →
`CreateUserRequest`.

**Runtime values the frontend needs go in `constants.ts`, never in a
`*.schema.ts`.** A single regex or role array left beside a schema drags the
whole schema graph — and Zod — into the client bundle. Schemas import from
`constants.ts`, so there is still one source of truth.

## Permissions

`resource:action` strings. Roles hold **explicit lists, no inheritance**, so a
role's exact powers are readable in one place.

```ts
export const PERMISSIONS = ['org:create', 'user:delete', …] as const;
export type Permission = (typeof PERMISSIONS)[number];
export const ROLE_PERMISSIONS: Record<OrganizationUserRole, readonly Permission[]>;
```

Helpers: `hasPermission`, `hasAnyPermission`, `hasAllPermissions`,
`getPermissionsForRole`.

| | API | Web / mobile |
|---|---|---|
| Enforce | `@Permissions('user:create')` | — |
| Hide a control | — | `<Can permission="user:create">` |
| Block a view | — | `<RequirePermission permission="user:list">` |
| In code | guard rejects the request | `useCan` / `useCanAny` / `useCanAll` |

**Only the API enforces.** Client checks decide what to show; a hidden button is
not a security boundary.

## Recipes

**Add a schema**

1. `src/schemas/thing.schema.ts` — export `ThingSchema` + `type Thing`.
2. Re-export from `src/schemas/index.ts`.
3. API: `@ZodRequest(CreateThingRequestSchema) dto: CreateThingRequest`.
4. Client: `import type { CreateThingRequest }` — free.

**Add a permission**

1. Add to `PERMISSIONS`.
2. Add to each role in `ROLE_PERMISSIONS` that should hold it — omission denies.
3. API: guard with `@Permissions('thing:create')` — not optional.
4. Client: gate with `<Can>`, `<RequirePermission>` or `useCan`.

**Add a constant the frontend needs**

Put it in `constants.ts` and let the schema import it. Adding it to a
`*.schema.ts` is what puts Zod back in the bundle.

**Add a subpath export**

Add the entry to `exports` in `package.json`, the file to `entry` in
`tsdown.config.ts`, and — if the frontend should reach it — an alias in
`apps/web/vite.config.ts`. Bare specifiers must come after their subpaths there;
aliases match by prefix in insertion order.

## Notes

- Builds to `dist/`, but `types` and the test aliases resolve `src/`, so changes
  apply without rebuilding.
- `PASSWORD_REGEX` is shared so client and server enforce the same rule.
