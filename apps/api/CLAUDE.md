# apps/api — agent notes

Read `./README.md` before changing this workspace.

- Controllers do no work: `@ZodRequest` + `@Permissions`/`@SystemRoles`, then
  hand `@ActiveUser` and the DTO to the service. Rules live in services, SQL
  in repositories.
- A new repository method takes `orgId`, joins on it, and gets a two-tenant
  integration test in `__tests__/` — no exceptions without a written reason.
- Service errors throw Nest exceptions carrying `k.*` translation keys, never
  sentences.
- Integration tests skip silently without `DATABASE_URL` — a green run without
  a database proves less than it looks.
