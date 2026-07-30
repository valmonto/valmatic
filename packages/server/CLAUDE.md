Read ./README.md before changing this workspace.

- Guard order in auth.provider.module.ts is load-bearing:
  Auth → ActiveOrg → Roles → Permissions → SystemRoles. Do not reorder.
- Anything added to the session token must also be re-read in the refresh path
  (verifyAccess → session), or it freezes at login for the whole session.
