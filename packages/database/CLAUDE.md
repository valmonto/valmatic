Read ./README.md before changing this workspace.

- Schema change = migration: edit src/schema/, then pnpm db:generate, and
  commit the generated SQL with it — after READING it (see below).
- Enums and shared constants come FROM @pkg/contracts (single source); never
  redeclare them here.
- No new pgEnum columns. A Postgres enum cannot lose a value without rebuilding
  the type, and adding one is its own migration headache. Use varchar with the
  value set enforced by the Zod schema in @pkg/contracts (add a CHECK
  constraint if you want the database to enforce it too). The existing pgEnums
  (system_role, notification type/channel) stay until deliberately migrated —
  do not copy the pattern.
- Renames and drops are where generated migrations destroy data. drizzle-kit
  cannot tell "rename column" from "drop + add" and resolves the ambiguity by
  PROMPTING — in a non-interactive run the generated SQL may drop the column
  and its data. So: read every generated migration before committing; a rename
  must appear as RENAME COLUMN, and if it appears as DROP + ADD, hand-write
  the migration instead (drizzle-kit generate --custom gives an empty file).
  Against a deployed database, prefer expand → backfill → contract across
  separate migrations over any in-place rename.
