# `@pkg/database`

Drizzle schema, the Postgres client, migrations, and the Nest module that wires
them up. Owns the tables; everything that queries them goes through here.

## Layout

```
src/
├── schema/        user · organization · organization-user · invitation · notification
│                  helpers.ts (pk), relations.ts
├── client.ts      createDatabaseClient — pooled postgres.js + Drizzle
├── migrate.ts     runMigrations
├── cli/           the db:migrate entry point
├── nestjs/        DatabaseModule, DATABASE_CLIENT
└── migrations/    generated SQL — committed, never edited
```

## Entry points

| Import | Contains |
|---|---|
| `@pkg/database` | client, Nest module, migrations, schema, and the Drizzle operators (`eq`, `and`, `desc`, …) |
| `@pkg/database/schema` | tables only — for anything that needs the shape but not a connection |

## Schema conventions

**Primary keys use `pk()`** — a UUIDv7 default. Time-sortable, so inserts stay
at the right edge of the index instead of scattering across it like UUIDv4.

```ts
export const user = pgTable('user', {
  id: pk(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull().defaultNow().$onUpdate(() => new Date()),
});

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
```

Row types are **inferred**, never hand-written: `Thing` for a selected row,
`NewThing` for an insert.

**Enums come from `@pkg/contracts`**, so the database constraint and the API
contract cannot drift:

```ts
export const systemRoleEnum = pgEnum('system_role', SYSTEM_ROLES);
```

Timestamps are always `withTimezone: true`. Relations live in `relations.ts`
using `defineRelations` (the Drizzle v1 API), not per-table `relations()`.

## The client connects lazily

`postgres.js` creates a pool without contacting the server; the first query
opens the connection. So a wrong `DATABASE_URL` starts the app cleanly and only
fails later, which is why `/health` in `@pkg/server` runs a real `select 1`
rather than trusting that boot succeeded.

The pool sets `prepare: false` for PgBouncer compatibility, and the Nest module
closes it on shutdown.

## Using it in an app

```ts
DatabaseModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({ url: config.getOrThrow('DATABASE_URL') }),
});
```

The module is `@Global`, so inject the client anywhere:

```ts
constructor(@Inject(DATABASE_CLIENT) private readonly db: DatabaseClient) {}
```

## Adding a table

1. `src/schema/thing.ts` — `pgTable`, `pk()` id, timestamps; export the table
   plus `Thing` / `NewThing`.
2. Re-export from `src/schema/index.ts`.
3. Add it to `relations.ts` if it joins anything.
4. `pnpm db:generate` — writes SQL into `src/migrations/`. Read it before
   committing; a rename Drizzle reads as drop-then-create loses the column's
   data.
5. `pnpm db:migrate` to apply.

**A flat file per table is right until a feature brings several of its own.**
Two closely-related tables are fine in one file, and the current schema is
deliberately flat. Once a feature owns four or five — billing with
subscriptions, invoices, lines, credit notes — give it a folder rather than
letting them scatter alphabetically among unrelated tables:

```
src/schema/
├── billing/
│   ├── subscription.ts
│   ├── invoice.ts
│   ├── invoice-line.ts
│   └── index.ts          re-exports the folder
└── notification.ts       still one table, still one file
```

The top-level `index.ts` re-exports the folder, so `drizzle.config.ts` and
every consumer are unchanged.

**On circular imports.** Tables reference each other freely today —
`organization` imports `user`, `organization-user` imports both — because
foreign keys are declared lazily:

```ts
.references(() => user.id, { onDelete: 'cascade' })
```

The arrow defers resolution past module evaluation, so a cycle in the import
graph is harmless. Two rules keep it that way: relations stay in `relations.ts`
rather than beside each table, so the relational graph is defined once at the
top; and a reference is always the `() =>` form, never a direct `user.id`. Once
folders exist, keep dependencies pointing one way between them — a `billing`
table referencing `user` is fine, `user` reaching back into `billing` means the
boundary is in the wrong place.

## Migrations

Generated files are **committed and immutable**. Editing one that has already
run leaves every deployed database on a state no file describes; fix it forward
with a new migration.

`pnpm db:migrate` runs `dist/cli/migrate.mjs`, so it needs a build first —
`pnpm --filter @pkg/database build`. In deployment the `migrate` service does
this before the API starts.

`pnpm db:push` skips migration files and syncs the schema straight to the
database. Local development only: it leaves no record of the change.
