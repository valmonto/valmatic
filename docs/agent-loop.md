# The agent loop

How features get built from tickets, decided in advance — same contract as
`operations.md`: each section is a decision with its trigger. Nothing here is
built yet; it activates at ticket 1.

## The flow

```
YOU          ticket in the spec app: description + screenshots + acceptance
              list + mode (see Modes)
BUILDER      the main agent session. Builds the feature VERTICALLY
              (contracts → api → web/mobile), pnpm verify green
UI-VERIFIER  agent: drives browser (Playwright MCP) / emulator (mobile-mcp),
              screenshots what actually rendered, compares against the ticket
REVIEWER     agent, FRESH context: judges spec-match (acceptance items,
              screenshots), repo rules (the sins checklist), readability.
              Concrete findings → builder iterates, MAX 2 rounds, then
              escalates "human needed"
YOU          PR + evidence pack (screenshots, checked acceptance list,
              reviewer report) lands as a ticket comment. You merge.
```

## The two custom agents — and why only two

They exist: `.claude/agents/ui-verifier.md` and
`.claude/agents/valmatic-reviewer.md`. The ticket's content arrives in the
invocation prompt, so the definitions (role, checklist, output contract) did
not need to wait for the ticket format — ticket 1 exercises them rather than
creates them.

There are deliberately NO role agents (frontender/backender/worker/packager):
the nested CLAUDE.md files make any agent the right specialist for whatever
directory it enters, and features build vertically — one agent carries a
feature through the stack because the contracts package already dictates the
interface a role-split pair would have to negotiate. Parallelism is per
FEATURE (N builders on N tickets), never per layer.

Every other quality concern is covered without a standing agent:

| Concern           | Covered by                                                                         |
| ----------------- | ---------------------------------------------------------------------------------- |
| dead code         | knip (a tool — deterministic; trigger: wire `pnpm hygiene` when it earns its keep) |
| security          | a reviewer dimension + occasional deliberate audit sweeps                          |
| readability       | a reviewer dimension + "polish <module>" as an on-demand ticket                    |
| untested code     | coverage report + reviewer judging which gaps matter                               |
| anything periodic | a monthly TICKET through the same loop — no cron machinery                         |

## Modes

The dial is per-ticket (`mode` field in the spec app), enforced by the loop:

- **semi-auto (default):** reviewer approves → PR waits for the human merge.
- **full-auto (MVP builds):** reviewer approve IS the merge; the loop pulls
  the next ticket. The human reviews the assembled MILESTONE (a running app
  beats 30 diff reviews for greenfield), set as a checkpoint every N tickets —
  checkpoints cap how far a mediocre merged foundation can compound.

Full-auto merges only on hard gates, never judgment alone: verify green +
every acceptance item checked + screenshots attached + reviewer approve.

**The always-human override list — no mode bypasses it:** auth/session/
tenancy code, database migrations, payments, deletions of user data, and
anything the reviewer escalates. A ticket cannot opt itself out.

Merged ≠ deployed, in every mode: production sits behind its own gates
(deploy secrets, the opt-in E2E_GATE).

## Verification ladder (what "looked at" means per target)

1. Web + Expo-web: Playwright MCP against the dev stack, seed logins.
2. Native paths (tokens.ts, push, haptics): emulator — `pnpm emu:setup` /
   `emu:start`, then mobile-mcp tools.
3. Irreducibly human: haptics feel, end-to-end push delivery — a phone.

## Build hygiene: teardown of dev stacks + worktrees

Build agents run inside a git worktree (under `.claude/worktrees/`) and boot a
throwaway api+vite stack for their browser check. Both must be torn down or a
box accumulates orphaned Vite listeners and multi-GB worktrees. Two layers keep
that from happening:

- **`scripts/dev-stack.sh`** boots the browser-check stack on a throwaway port
  set (`API_PORT` 3002 / `WEB_PORT` 5175, never the live :3000/:5173) against a
  throwaway `devstack_*` Postgres DB, and installs `trap cleanup EXIT INT TERM`
  so the stack is killed by its ports and the DB dropped even on failure or
  interrupt. It refuses the live ports and any DB name outside `devstack_*`, and
  Vite proxies `/api` to the stack's own api via `API_PROXY_TARGET`. Pass a
  command to run-then-teardown, or none to hold until interrupted.
- **`scripts/reap-build-leaks.mjs`** is the periodic / start-of-run broom for
  what a bad exit left behind. Its ONE kill criterion is a process whose cwd is
  strictly under `.claude/worktrees/`; a live dev stack in the main checkout is
  a sibling of that root and is never touched. It prunes only orphaned worktrees
  (unlocked, no live process inside). **Dry-run by default** — pass `--apply`
  (alias `--force`) to actually kill + prune. The discriminator (`classifyCwd` /
  `classifyWorktree`) is unit-tested in
  `packages/server/__tests__/scripts/reap-build-leaks.test.ts`, so the
  never-touch-live rule is proven without running anything destructive.
