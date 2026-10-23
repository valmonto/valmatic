# Add-ons

Optional parts of the template. A project keeps the ones it needs and drops
the rest; nothing is left behind, and CI proves the template works both with
every add-on and with none.

`valmatic.json`, at the root, says which a project has:

```json
{ "addons": { "mobile": true } }
```

| Add-on   | What it is                                                                                                           |
| -------- | -------------------------------------------------------------------------------------------------------------------- |
| `mobile` | The Expo app (`apps/mobile`), its texts, the dashboard's phone-layout demo at `/mobile`, and the mobile pnpm catalog |

Billing comes later, with its payment providers chosen inside it.

## Where an add-on lives

An add-on called `mobile` is, by convention:

- an `addons/mobile/` folder in each layer it touches, with its tests inside
  it (`addons/mobile/__tests__/`):

  | Layer        | Folder                                        | Its `index` exports              |
  | ------------ | --------------------------------------------- | -------------------------------- |
  | Contracts    | `packages/contracts/src/addons/mobile/`       | schemas and types                |
  | Database     | `packages/database/src/schema/addons/mobile/` | tables                           |
  | Translations | `packages/locales/src/addons/mobile/`         | `keys.ts` (`keys`), `en.json`, … |
  | API          | `apps/api/src/addons/mobile/`                 | `addonModule` (a Nest module)    |
  | Worker       | `apps/worker/src/addons/mobile/`              | `addonModule` (a Nest module)    |
  | Dashboard    | `apps/web/src/addons/mobile/`                 | `addon` (routes, links)          |

- the app `apps/mobile`, if there is one (apps not named after an add-on are
  core);
- lines between `# addon:mobile begin` and `# addon:mobile end` in
  `pnpm-workspace.yaml`, and root scripts ending in `:mobile`.

Each layer has one generated file, `addons.generated.ts`, that imports the
add-ons present; core code imports only that file:

```ts
// apps/api/src/app.module.ts
imports: [...coreModules, ...addonModules],
```

Texts are under the add-on's name: `k.mobile.update.required`, with entries
like `"mobile.update.required"` in the add-on's own `en.json`.

## The rules

1. **Core never imports an add-on folder.** Only `addons.generated.ts` does.
   An add-on may use core code freely.
2. **An add-on's tests live in its folder**, so they go with it, and core
   tests never touch an add-on's tables or routes.
3. **Never edit `addons.generated.ts` by hand.** `pnpm addons:sync` writes it.

`pnpm addons:check` (part of `pnpm verify`) fails when a generated file is
out of date, when `valmatic.json` and the folders disagree, or when core code
imports an add-on folder.

## Turning one off

Set it to `false` in `valmatic.json`, then:

```bash
pnpm addons:sync
pnpm install
```

The sync deletes the add-on's folders and app, its regions and scripts, and
rewrites the generated files.

**Add-ons with database tables:** a project whose database exists needs a
migration that drops them; the sync refuses and says so. A new project, with
no database yet, runs `pnpm addons:sync --new-project`: the migrations are
rebuilt as one starting migration from the tables that remain.
`pnpm init:project` does this for you.

## Turning one on later

Copy its folders (and app) in from valmatic, set it to `true`, run
`pnpm addons:sync` and `pnpm install`. If it has tables, generate a migration
for them as usual (`pnpm --filter @pkg/database db:generate`).

## Adding a new add-on

Pick a lowercase name (not `api`, `web` or `worker`), add it to
`valmatic.json`, create its `addons/<name>/` folders with the exports above,
and run `pnpm addons:sync`. Put anything mobile-only or otherwise optional
there rather than in core.
