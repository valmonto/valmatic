Read ./README.md before changing this workspace.

- @pkg/contracts resolves to its Zod-free client entry here. Never import a
  schema for .parse — if the bundle gains Zod, an alias was bypassed.
- Permission hooks (useCan, usePermissions, useOrgRole, useSystemRole) decide
  what to RENDER; the API enforces. Never derive permissions from a role
  client-side — they arrive resolved from /auth/me.
- Keep the permission-hook API identical to apps/mobile. They diverged once
  (anyOf/allOf vs any/all) and components silently rendered nothing.
- Org-scoped SWR keys are stale after an org switch — actions that change the
  active org reset all caches, not just their own.
- UI changes get LOOKED at before they ship: use the Playwright MCP tools
  (browser is available via .mcp.json) against the dev server with a seed
  login. Typecheck proves it compiles; only your eyes prove it matches.
