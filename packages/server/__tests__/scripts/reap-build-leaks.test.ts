import { describe, expect, it } from 'vitest';

// The reaper is a plain .mjs tool in scripts/; we import its PURE discriminators
// directly (no /proc, no git, nothing destructive) and prove the one rule that
// keeps it from ever taking a live stack down.
// @ts-expect-error — untyped .mjs tool imported for its exported pure functions.
import { classifyCwd, classifyWorktree } from '../../../../scripts/reap-build-leaks.mjs';

const ROOT = '/repo/.claude/worktrees';

describe('reap-build-leaks discriminator: classifyCwd', () => {
  it('KILLS a process whose cwd is strictly under the worktrees root', () => {
    expect(classifyCwd('/repo/.claude/worktrees/agent-abc', ROOT).action).toBe('kill');
    // …including nested boot dirs (a build stack booted from apps/web inside its worktree)
    expect(classifyCwd('/repo/.claude/worktrees/agent-abc/apps/web', ROOT).action).toBe('kill');
    expect(classifyCwd('/repo/.claude/worktrees/agent-abc/apps/api', ROOT).action).toBe('kill');
  });

  it('KEEPS the live main-checkout processes (:3000 api, :5173 web) — never killed', () => {
    // These are the LIVE dev processes. Their cwds are siblings of the
    // worktrees root, never inside it.
    expect(classifyCwd('/repo/apps/api', ROOT).action).toBe('keep');
    expect(classifyCwd('/repo/apps/web', ROOT).action).toBe('keep');
    expect(classifyCwd('/repo', ROOT).action).toBe('keep');
  });

  it('KEEPS the worktrees root itself and anything outside it', () => {
    expect(classifyCwd('/repo/.claude/worktrees', ROOT).action).toBe('keep');
    expect(classifyCwd('/', ROOT).action).toBe('keep');
    expect(classifyCwd('/var/lib/docker/whatever', ROOT).action).toBe('keep'); // object storage lives here
    // A different repo's worktrees dir must not match ours.
    expect(classifyCwd('/home/other/.claude/worktrees/agent-x', ROOT).action).toBe('keep');
  });

  it('KEEPS when cwd is unreadable (null) rather than guessing kill', () => {
    expect(classifyCwd(null, ROOT).action).toBe('keep');
    expect(classifyCwd(undefined, ROOT).action).toBe('keep');
  });

  it('is not fooled by a prefix that is not a path boundary', () => {
    // `…/worktrees-backup` shares a string prefix with `…/worktrees` but is a
    // sibling, not inside it — must be kept.
    expect(classifyCwd('/repo/.claude/worktrees-backup/x', ROOT).action).toBe('keep');
  });
});

describe('reap-build-leaks discriminator: classifyWorktree', () => {
  it('REMOVES an orphaned worktree (under root, unlocked, no live process inside)', () => {
    const wt = { path: '/repo/.claude/worktrees/agent-dead', locked: false };
    expect(classifyWorktree(wt, ROOT, []).action).toBe('remove');
  });

  it('KEEPS a locked worktree — a lock means an active agent owns it', () => {
    const wt = { path: '/repo/.claude/worktrees/agent-live', locked: true };
    expect(classifyWorktree(wt, ROOT, []).action).toBe('keep');
  });

  it('KEEPS a worktree with a live process still cwd-inside it', () => {
    const wt = { path: '/repo/.claude/worktrees/agent-busy', locked: false };
    const liveCwds = ['/repo/.claude/worktrees/agent-busy/apps/api'];
    expect(classifyWorktree(wt, ROOT, liveCwds).action).toBe('keep');
  });

  it('KEEPS the main checkout worktree (not under the worktrees root)', () => {
    const wt = { path: '/repo', locked: false };
    expect(classifyWorktree(wt, ROOT, []).action).toBe('keep');
  });
});
