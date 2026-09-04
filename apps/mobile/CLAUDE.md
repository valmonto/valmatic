Read ./README.md before changing this workspace.

- Same contracts rule as web: Zod-free client entry only.
- Mirror apps/web's permission-hook API in lockstep — same names, same shapes.
- A shipped mobile build cannot be redeployed on demand: never bake the
  permission table (or any policy) into the client; it must arrive from the API.
- Outside pnpm lint and without tests today (see GAPS.md) — that is debt, not
  licence to add more uncovered code.
- Verify UI via `expo start --web` + Playwright MCP at a phone viewport
  (390×844). That covers layout, flows and navigation — it does NOT cover the
  native modules this app ALREADY uses out of the box: secure-store (the
  entire token storage — on web it falls back to localStorage, so web preview
  exercises a DIFFERENT code path than devices run), push notifications,
  haptics (wired into most UI components), and blur effects. Never sign those
  off from a browser preview.
- Changes touching tokens.ts, notifications/, or haptic behaviour need the
  emulator path: `pnpm emu:setup` + `emu:start` provision and boot it, then
  use the mobile-mcp TOOLS (screenshot, tap by label, inspect) — do not shell
  out to adb for what the tools already do. Haptics feel and end-to-end push
  delivery remain human-verified on a device.
- expo-secure-store and expo-notifications have NO web implementation: a direct
  call at module scope or in an unguarded effect throws on the web preview and
  Expo's error overlay blocks every page. Persist through
  `shared/lib/secure-storage` (keychain on device, localStorage on web) and
  guard notification calls with `Platform.OS === 'web'`. Both happened once
  and took the whole `expo start --web` path down.
