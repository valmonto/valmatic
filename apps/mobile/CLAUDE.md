Read ./README.md before changing this workspace.

- Same contracts rule as web: Zod-free client entry only.
- Mirror apps/web's permission-hook API in lockstep — same names, same shapes.
- A shipped mobile build cannot be redeployed on demand: never bake the
  permission table (or any policy) into the client; it must arrive from the API.
- Outside pnpm lint and without tests today (see GAPS.md) — that is debt, not
  licence to add more uncovered code.
- Verify UI via `expo start --web` + Playwright MCP at a phone viewport
  (390×844). That covers layout, flows and navigation — it does NOT cover
  native modules: push notifications, haptics, secure-store, blur/glass
  effects, and some reanimated/gesture behaviour render differently or not at
  all on web. Never sign those off from a browser preview; they need the
  emulator/device path (raw adb first, mobile-mcp if it sticks), which is
  deliberately unwired until such a feature ships.
