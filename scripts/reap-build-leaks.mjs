#!/usr/bin/env node
/**
 * reap-build-leaks.mjs — safety net that cleans up build cruft the per-task
 * teardown missed: orphaned build processes and leftover git worktrees.
 *
 * Build subagents run inside git worktrees under `.claude/worktrees/` and boot
 * throwaway dev stacks for their browser checks. When a subagent dies badly the
 * stack can be orphaned and its worktree persists (Agent worktrees are only
 * auto-removed when UNCHANGED — build worktrees always have commits). A multi-
 * task run once left many worktrees totalling gigabytes plus a stray Vite
 * listener. This reaper is the periodic / start-of-run broom.
 *
 * ┌─ THE ONE KILL CRITERION ─────────────────────────────────────────────────┐
 * │ A process is killed ONLY when its cwd is strictly UNDER the worktrees root │
 * │ (`<repo>/.claude/worktrees/`). Nothing else — not port, not name, not CPU. │
 * └───────────────────────────────────────────────────────────────────────────┘
 *
 * WHY cwd, and why this is safe: a machine may run a LIVE dev stack in watch
 * mode — api on :3000 (child of `nest start --watch`) and web on `vite :5173`,
 * BOTH with cwd in the MAIN checkout (apps/{api,web}), plus object storage in
 * docker. None of those have a cwd under `.claude/worktrees/`, so the
 * discriminator keeps every one of them. The rule is proven in
 * `packages/server/__tests__/scripts/reap-build-leaks.test.ts` without running
 * anything destructive.
 *
 * Worktree pruning: leftover worktrees under the root are removed
 * (`git worktree remove --force` + `git worktree prune`) — but only when they
 * look ORPHANED: NOT locked (an active agent locks its worktree) and with NO
 * surviving process cwd'd inside them.
 *
 * SAFETY DEFAULT: `--dry-run` (the default) only PRINTS what it would kill /
 * remove. You must pass `--apply` (alias `--force`) to actually act. Never run
 * `--apply` casually on a box hosting a live stack — a mistake here can take
 * the site down.
 *
 * USAGE:
 *   node scripts/reap-build-leaks.mjs                 # dry run — print only
 *   node scripts/reap-build-leaks.mjs --apply         # actually kill + prune
 *   node scripts/reap-build-leaks.mjs --worktrees-root <path>   # override root
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, readlinkSync, readFileSync, existsSync } from 'node:fs';
import { resolve, relative, isAbsolute, join } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * THE DISCRIMINATOR — pure, exported, and unit-tested.
 *
 * Decide whether a process with the given cwd is a build leak (kill) or must be
 * left alone (keep). The single rule: kill iff `cwd` is strictly inside
 * `worktreesRoot`. Equal-to-root, outside-root, and unreadable cwds are all
 * kept — that is what protects the live main-checkout processes (:3000/:5173/
 * object storage), whose cwds are siblings of the worktrees root, never inside it.
 *
 * @param {string|null|undefined} cwd            resolved working directory of a process
 * @param {string} worktreesRoot                 absolute path of `<repo>/.claude/worktrees`
 * @returns {{ action: 'kill'|'keep', reason: string }}
 */
export function classifyCwd(cwd, worktreesRoot) {
  if (!cwd) return { action: 'keep', reason: 'cwd unreadable' };
  const root = resolve(worktreesRoot);
  const target = resolve(cwd);
  const rel = relative(root, target);
  // Strictly inside: relative path is non-empty, not an escape (`..`), not absolute.
  const inside = rel !== '' && !rel.startsWith('..') && !isAbsolute(rel);
  return inside
    ? { action: 'kill', reason: `cwd under worktrees root (${rel})` }
    : {
        action: 'keep',
        reason: rel === '' ? 'cwd is the worktrees root itself' : 'cwd outside worktrees root',
      };
}

/**
 * A worktree under the root is prunable only when it looks ORPHANED: not locked
 * (an active agent locks its worktree) and with no live process still cwd'd
 * inside it. Pure so the gate is testable alongside the kill rule.
 *
 * @param {{ path: string, locked: boolean }} wt
 * @param {string} worktreesRoot
 * @param {string[]} liveCwds  resolved cwds of surviving processes
 * @returns {{ action: 'remove'|'keep', reason: string }}
 */
export function classifyWorktree(wt, worktreesRoot, liveCwds) {
  const root = resolve(worktreesRoot);
  const wtPath = resolve(wt.path);
  const rel = relative(root, wtPath);
  const under = rel !== '' && !rel.startsWith('..') && !isAbsolute(rel);
  if (!under) return { action: 'keep', reason: 'not under worktrees root (main checkout / other)' };
  if (wt.locked) return { action: 'keep', reason: 'locked (active agent owns it)' };
  const busy = liveCwds.some((c) => {
    const r = relative(wtPath, resolve(c));
    return r === '' || (!r.startsWith('..') && !isAbsolute(r));
  });
  if (busy) return { action: 'keep', reason: 'a live process is still cwd-inside it' };
  return { action: 'remove', reason: 'orphaned (unlocked, no live process inside)' };
}

// ── CLI (only when executed directly, not when imported by the test) ──────────

function repoRoot() {
  return execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
}

/** Read /proc for every pid we can, returning {pid, cwd, cmd}. Linux-only. */
function scanProcs() {
  const out = [];
  let pids;
  try {
    pids = readdirSync('/proc').filter((n) => /^\d+$/.test(n));
  } catch {
    return out; // non-Linux / no /proc — the reaper is a Linux box tool
  }
  for (const pid of pids) {
    let cwd = null;
    let cmd = '';
    try {
      cwd = readlinkSync(`/proc/${pid}/cwd`);
    } catch {
      continue; // vanished or not ours — skip
    }
    try {
      cmd = readFileSync(`/proc/${pid}/cmdline`, 'utf8').replace(/\0/g, ' ').trim();
    } catch {
      /* best effort */
    }
    out.push({ pid: Number(pid), cwd, cmd });
  }
  return out;
}

/** pids to never signal: this reaper and its ancestor shells. */
function selfAncestry() {
  const skip = new Set();
  let pid = process.pid;
  for (let i = 0; i < 64 && pid > 1; i++) {
    skip.add(pid);
    try {
      const stat = readFileSync(`/proc/${pid}/stat`, 'utf8');
      // ppid is the 4th field, but comm (2nd) may contain spaces/parens — split after `)`.
      const after = stat.slice(stat.lastIndexOf(')') + 2).split(' ');
      pid = Number(after[1]);
    } catch {
      break;
    }
  }
  return skip;
}

function listWorktrees() {
  let porcelain;
  try {
    porcelain = execFileSync('git', ['worktree', 'list', '--porcelain'], { encoding: 'utf8' });
  } catch {
    return [];
  }
  const worktrees = [];
  let cur = null;
  for (const line of porcelain.split('\n')) {
    if (line.startsWith('worktree ')) {
      if (cur) worktrees.push(cur);
      cur = { path: line.slice('worktree '.length), locked: false };
    } else if (line === 'locked' || line.startsWith('locked ')) {
      if (cur) cur.locked = true;
    }
  }
  if (cur) worktrees.push(cur);
  return worktrees;
}

function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply') || args.includes('--force');
  const rootFlag = args.indexOf('--worktrees-root');
  const worktreesRoot =
    rootFlag !== -1 && args[rootFlag + 1]
      ? resolve(args[rootFlag + 1])
      : join(repoRoot(), '.claude', 'worktrees');

  const mode = apply ? 'APPLY (destructive)' : 'DRY-RUN (print only)';
  console.log(`reap-build-leaks: ${mode}`);
  console.log(`worktrees root: ${worktreesRoot}`);
  if (!existsSync(worktreesRoot)) {
    console.log('  (no worktrees root — nothing to reap)');
    return;
  }

  const skip = selfAncestry();
  const procs = scanProcs();
  const survivorCwds = [];
  const toKill = [];
  for (const p of procs) {
    const verdict = classifyCwd(p.cwd, worktreesRoot);
    if (verdict.action === 'kill' && !skip.has(p.pid)) {
      toKill.push(p);
    } else {
      if (p.cwd) survivorCwds.push(p.cwd);
    }
  }

  console.log(`\nOrphaned processes (cwd under worktrees root): ${toKill.length}`);
  for (const p of toKill) {
    console.log(`  pid ${p.pid}  ${p.cwd}  ::  ${p.cmd.slice(0, 80)}`);
    if (apply) {
      try {
        process.kill(p.pid, 'SIGTERM');
      } catch (e) {
        console.log(`    (failed to signal: ${e.message})`);
      }
    }
  }

  const worktrees = listWorktrees();
  const removable = [];
  for (const wt of worktrees) {
    const verdict = classifyWorktree(wt, worktreesRoot, survivorCwds);
    if (verdict.action === 'remove') removable.push(wt);
  }

  console.log(`\nLeftover worktrees to prune: ${removable.length}`);
  for (const wt of removable) {
    console.log(`  ${wt.path}`);
    if (apply) {
      try {
        execFileSync('git', ['worktree', 'remove', '--force', wt.path], { stdio: 'inherit' });
      } catch (e) {
        console.log(`    (remove failed: ${e.message})`);
      }
    }
  }
  if (apply) {
    execFileSync('git', ['worktree', 'prune'], { stdio: 'inherit' });
    console.log('\nApplied. Verify any live stack still answers before walking away.');
  } else {
    console.log('\nDry run only — nothing killed or removed. Re-run with --apply to act.');
  }
}

// Run only when invoked directly; stay inert (just exports) when imported.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
