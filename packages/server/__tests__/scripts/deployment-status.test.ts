import { describe, expect, it, vi } from 'vitest';

// The checker is a plain .mjs tool in scripts/; its orchestrator takes fetch
// and git as injected dependencies, so the whole verdict path runs here with
// no network and no checkout.
// @ts-expect-error — untyped .mjs tool imported for its exported functions.
import { assess, deploymentStatus, healthUrl } from '../../../../scripts/deployment-status.mjs';

const HEAD = 'a'.repeat(40);
const OLD = 'b'.repeat(40);
const STRANGER = 'c'.repeat(40);

type Distance = { ahead: number; behind: number } | null;

const fakeGit = (head: string | null, distances: Record<string, Distance> = {}) => ({
  head: vi.fn(async () => head),
  distance: vi.fn(async (from: string) => distances[from] ?? null),
});

const healthy = (sha: string | null, extra: Record<string, unknown> = {}) =>
  vi.fn(async () => ({
    status: 200,
    text: async () =>
      JSON.stringify({
        status: 'ok',
        uptime: 42,
        sha,
        builtAt: '2026-09-03T18:50:40.000Z',
        ...extra,
      }),
  }));

describe('deploymentStatus', () => {
  it('reads LIVE when the app serves the sha at HEAD', async () => {
    const r = await deploymentStatus({
      url: 'https://app.test',
      fetchImpl: healthy(HEAD),
      git: fakeGit(HEAD),
    });

    expect(r.status).toBe('live');
    expect(r.behind).toBe(0);
    expect(r.runningSha).toBe(HEAD);
    expect(r.uptime).toBe(42);
    expect(r.builtAt).toBe('2026-09-03T18:50:40.000Z');
  });

  it('reads BEHIND with the commit count when the app runs an ancestor of HEAD', async () => {
    const git = fakeGit(HEAD, { [OLD]: { ahead: 0, behind: 1 } });
    const r = await deploymentStatus({ url: 'https://app.test', fetchImpl: healthy(OLD), git });

    expect(r.status).toBe('behind');
    expect(r.behind).toBe(1);
    expect(git.distance).toHaveBeenCalledWith(OLD, HEAD);
  });

  it('reads UNKNOWN (unreachable), not behind, when the app cannot be reached', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('ECONNREFUSED');
    });
    const r = await deploymentStatus({ url: 'https://app.test', fetchImpl, git: fakeGit(HEAD) });

    expect(r.status).toBe('unknown');
    expect(r.reason).toBe('unreachable');
    expect(r.behind).toBeUndefined();
  });

  it('reads UNKNOWN (no_sha) when the app was built without GIT_SHA — and still surfaces uptime', async () => {
    const r = await deploymentStatus({
      url: 'https://app.test',
      fetchImpl: healthy(null),
      git: fakeGit(HEAD),
    });

    expect(r.status).toBe('unknown');
    expect(r.reason).toBe('no_sha');
    expect(r.uptime).toBe(42);
  });

  it('reads UNKNOWN (sha_not_in_repo) when git has never seen the running sha', async () => {
    const r = await deploymentStatus({
      url: 'https://app.test',
      fetchImpl: healthy(STRANGER),
      git: fakeGit(HEAD),
    });

    expect(r.status).toBe('unknown');
    expect(r.reason).toBe('sha_not_in_repo');
  });

  it('reads DIVERGED when the running sha is known but not an ancestor of HEAD', async () => {
    const git = fakeGit(HEAD, { [OLD]: { ahead: 2, behind: 3 } });
    const r = await deploymentStatus({ url: 'https://app.test', fetchImpl: healthy(OLD), git });

    expect(r.status).toBe('diverged');
    expect(r).toMatchObject({ ahead: 2, behind: 3 });
  });

  it('still reads the sha from a 503 — a degraded app is reachable, and its identity is the truth', async () => {
    const fetchImpl = vi.fn(async () => ({
      status: 503,
      text: async () => JSON.stringify({ status: 'degraded', uptime: 7, sha: HEAD, builtAt: null }),
    }));
    const r = await deploymentStatus({ url: 'https://app.test', fetchImpl, git: fakeGit(HEAD) });

    expect(r.status).toBe('live');
    expect(r.health).toBe('degraded');
  });

  it('surfaces uptime on every reachable verdict, so a deploy that replaced nothing is visible', async () => {
    // 68,000s ≈ 18.9h: the number that gave the stale deploy away.
    const git = fakeGit(HEAD, { [OLD]: { ahead: 0, behind: 1 } });
    const r = await deploymentStatus({
      url: 'https://app.test',
      fetchImpl: healthy(OLD, { uptime: 68_000 }),
      git,
    });

    expect(r.uptime).toBe(68_000);
  });
});

describe('assess', () => {
  it('never fabricates a sha from a placeholder the app might serve', () => {
    const r = assess({
      health: { ok: true, body: { sha: 'unknown', uptime: 1 } },
      headSha: HEAD,
      distance: null,
    });

    expect(r.status).toBe('unknown');
    expect(r.reason).toBe('no_sha');
    expect(r.runningSha).toBeNull();
  });

  it('reads unknown when the ref itself cannot be resolved', () => {
    const r = assess({ health: { ok: true, body: { sha: HEAD } }, headSha: null, distance: null });

    expect(r).toMatchObject({ status: 'unknown', reason: 'no_head' });
  });
});

describe('healthUrl', () => {
  it('appends /health to a base URL and leaves an explicit /health alone', () => {
    expect(healthUrl('https://app.test')).toBe('https://app.test/health');
    expect(healthUrl('https://app.test/')).toBe('https://app.test/health');
    expect(healthUrl('https://app.test/api')).toBe('https://app.test/api/health');
    expect(healthUrl('https://app.test/health')).toBe('https://app.test/health');
  });
});
