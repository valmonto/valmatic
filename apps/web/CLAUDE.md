# apps/web — agent notes

Read `./README.md` before changing this workspace.

- `@pkg/contracts` is aliased to its Zod-free client entry here. Never import
  a schema for its `.parse` — if the bundle gains Zod, the alias was bypassed.
- Permission hooks (`useCan`, `usePermissions`, `useOrgRole`, `useSystemRole`)
  decide what to RENDER only; the API enforces. Keep the hook API identical to
  apps/mobile — they diverged once and silently rendered nothing.
