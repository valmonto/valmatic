# apps/mobile — agent notes

Read `./README.md` before changing this workspace.

- Same contracts rule as web: Zod-free client entry only.
- The permission-hook API mirrors `apps/web` exactly — keep them in lockstep.
- This workspace is outside `pnpm lint` (React Compiler false positives) and
  has no tests yet; both are tracked in `GAPS.md`, not licence to add more
  uncovered code.
