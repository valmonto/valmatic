# @pkg/server — agent notes

Read `./README.md` before changing this workspace.

- Guard order in `auth.provider.module.ts` is load-bearing:
  Auth → ActiveOrg → Roles → Permissions → SystemRoles. Do not reorder.
- Two role axes, both enums contain `ADMIN`: `orgRole` feeds
  `@Roles`/`@Permissions`, `systemRole` feeds `@SystemRoles` — never cross them.
- Anything added to the session token must also be re-read in the refresh path
  (`verifyAccess` → session), or it freezes at login for the whole session.
