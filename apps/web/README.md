# `apps/web`

The React SPA. Vite, React Router, SWR for server state, Tailwind and shadcn-style
components. Types and permissions come from `@pkg/contracts`, so the client and
API cannot disagree about a shape.

## Structure

```
src/
├── features/     one folder per domain — the app lives here
├── pages/        top-level routes and layouts
├── components/   ui · layouts · overlays — presentational, domain-free
├── shared/       api client, auth, permissions, hooks, store, attachments kit
├── lib/          third-party glue
├── api.ts        composes every feature's resource into one `api` object
└── main.tsx
```

**Features own their vertical.** A domain's routes, data hooks, HTTP calls and
components live together, so adding one touches one folder rather than five
parallel trees.

## Anatomy of a feature

```
features/users/
├── users.page.tsx      the screen
├── routes.tsx          this feature's route subtree
├── api.ts              typed HTTP calls
├── hooks/use-users.ts  data fetching, caching, mutations
├── components/         pieces used only by this feature
└── index.ts            what the rest of the app may import
```

Nothing outside a feature imports its internals — only what `index.ts` exports.
Something two features need moves to `shared/`, something purely visual moves to
`components/`.

## Components

```
components/
├── ui/        55 shadcn primitives — button, dialog, table, form…
├── overlays/  CompactModal, WideModal
└── layouts/   page chrome
```

**`ui/` is shadcn, and shadcn is copy-in, not a dependency.** Add a primitive
with `pnpm shadcn:add dialog`; it writes the source into `ui/` and it is yours
to edit. Config lives in `components.json` — new-york style, neutral base,
lucide icons, CSS variables. Do not hand-write a primitive that shadcn already
ships, and do not fight an upstream update: once it is in `ui/`, that file is
the version of record.

**Dialogs go through the overlays, not raw `<Dialog>`.** `CompactModal` for
confirmations and short forms, `WideModal` where content needs the room. Both
wrap the shadcn dialog with a consistent header, description and footer slot,
and take either a `trigger` (uncontrolled) or `open` / `onOpenChange`
(controlled):

```tsx
<CompactModal
  trigger={<Button>Invite</Button>}
  title="Invite a member"
  footer={<Button type="submit">Send</Button>}
>
  <InviteForm />
</CompactModal>
```

Reaching for `<Dialog>` directly is how spacing and close-button behaviour start
drifting between screens. `src/pages/components.page.tsx` renders every
primitive and overlay as a live reference.

Anything domain-aware belongs in `features/x/components/` — `components/` stays
presentational and knows nothing about users, orgs or permissions.

**`shared/attachments/`** is the file-upload kit (docs/storage.md): drop
`<AttachmentsSection subjectType="task" subjectId={id} />` into any detail
view and it handles the declare → presigned PUT → confirm protocol, the tile
grid and the near-fullscreen gallery. It lives in `shared/` (not a feature)
because any feature may attach files; the subject type must have a resolver
registered in the API. The components page demos the gallery on stub data.

## Where API calls go

Three layers, and each has one job.

**`features/x/api.ts`** — a resource factory of typed calls. Types come from
`@pkg/contracts`; there are no hand-written request or response shapes.

```ts
export const userResource = (client: HttpClient) => ({
  list: (dto: ListUsersRequest): Promise<ListUsersResponse> =>
    client.get('/api/users', { params: dto }),
  create: (dto: CreateUserRequest): Promise<CreateUserResponse> => client.post('/api/users', dto),
});
```

**`src/api.ts`** composes those factories into one `api` object. It exists so a
resource can be constructed with a different client (tests, a second base URL)
rather than importing a singleton everywhere.

**`features/x/hooks/`** is what components actually use. Components never call
`api.*` directly — the hook owns cache keys, invalidation and loading state, and
that is the part you do not want re-implemented per screen.

## Reads and writes

|       | Hook               | Gives you                                      |
| ----- | ------------------ | ---------------------------------------------- |
| read  | `useCachedRequest` | SWR-cached data, `isLoading`, `mutate`         |
| write | `useActionRequest` | `execute`, `isLoading`, `error` — never throws |

`useActionRequest` wraps the call in `tryCatch`, so a failed mutation renders an
error instead of unmounting the tree. Both hold a request for a minimum duration
(300 ms) so spinners do not flash on a fast response.

**Cache keys are namespaced by organization:**

```ts
`org:${orgId}/users`;
```

Switching tenants therefore cannot surface another org's cached rows, and one
`invalidate()` revalidates every view in that domain at once. Any new cached
query must carry the same prefix — a key without it survives an org switch.

## Routing

Each feature exports a `routes.tsx` subtree that the app router aggregates, so
adding a route never edits a central file:

```ts
export const userRoutes: RouteObject[] = [
  { path: 'users', lazy: () => import('./users.page').then((m) => ({ Component: m.default })) },
];
```

Pages are lazy by default — a feature's code is not in the initial bundle.

## Permissions

Gate UI with the same permissions the API enforces:

```tsx
<Can permission="user:create"><CreateUserButton /></Can>
<RequirePermission permission="user:list"><UsersTable /></RequirePermission>
```

`<Can>` hides silently; `<RequirePermission>` shows a denied state. `useCan()`
covers the rest. **None of this is security** — the API enforces; these only
decide what to render.

## Imports from `@pkg/contracts`

`@pkg/contracts` is aliased to its client entry here, so the bare specifier is
already Zod-free. Import types with `import type`. Reaching for a schema —
client-side validation — means importing `@pkg/contracts/schemas` explicitly,
which is visible in review rather than silently adding Zod to the bundle.

## Adding a feature

1. `features/thing/` with `api.ts`, `hooks/`, `routes.tsx`, the page, `index.ts`.
2. Add the resource to `src/api.ts`.
3. Add `thingRoutes` to the app router.
4. Namespace cache keys with `org:${orgId}/thing`.
5. Gate anything privileged with `<Can>`.

## Testing

Vitest with testing-library; MSW intercepts HTTP (`__tests__/mocks/handlers.ts`),
started with `onUnhandledRequest: 'error'` so an unstubbed call fails loudly.
Full-stack flows belong in `apps/e2e`, not here.

```bash
pnpm dev --filter @pkg/web
pnpm --filter @pkg/web test
```

The dev server proxies `/api` to `localhost:3000`, so run the API alongside it.
