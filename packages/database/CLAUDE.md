# @pkg/database — agent notes

Read `./README.md` before changing this workspace.

- Schema change = migration: edit `src/schema/`, then `pnpm db:generate`, and
  commit the generated SQL with it.
- Enums and shared constants come FROM `@pkg/contracts` (single source);
  never redeclare them here.
