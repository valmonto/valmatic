Read ./README.md before changing this workspace.

- Same contracts rule as web: Zod-free client entry only.
- Mirror apps/web's permission-hook API in lockstep — same names, same shapes.
- A shipped mobile build cannot be redeployed on demand: never bake the
  permission table (or any policy) into the client; it must arrive from the API.
- Outside pnpm lint and without tests today (see GAPS.md) — that is debt, not
  licence to add more uncovered code.
