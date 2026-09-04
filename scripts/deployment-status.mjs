#!/usr/bin/env node
/**
 * deployment-status.mjs — is the deployed app running what main says it should?
 *
 * Reads the build identity a valmatic app serves from `/health` (`sha`,
 * `builtAt`, `uptime` — see packages/server/src/modules/health) and compares
 * it to a git ref (default `origin/main`). Answers ONE of:
 *
 *   live      — the running sha IS the ref's head
 *   behind    — the running sha is an ancestor of head, N commits back
 *   diverged  — the running sha is known but not an ancestor (a hotfix, a
 *               deploy from another branch): ahead/behind counts are given
 *   unknown   — the app could not be reached, serves no sha, or serves a sha
 *               this checkout has never seen. `reason` says which.
 *
 * `unknown` is NEVER folded into `behind`. Conflating "I can't tell" with
 * "it's old" is how a stale-but-green deploy stayed unresolved for hours: the
 * two call for different actions (fix the probe vs. fix the deploy).
 *
 * `uptime` is surfaced beside the verdict because a deploy can succeed WITHOUT
 * replacing the container (the tree did not change, so the image did not) —
 * an uptime of hours right after a "successful" deploy is that exact case.
 *
 * USAGE:
 *   node scripts/deployment-status.mjs <url> [--ref origin/main] [--fetch] [--json]
 *   pnpm deploy:status https://app.example.com --fetch
 *
 *   <url>     base URL of the api (or the /health URL itself)
 *   --ref     git ref to compare against (default: origin/main)
 *   --fetch   run `git fetch origin` first so the ref is current
 *   --json    machine-readable output
 *
 * EXIT CODE: 0 live · 1 behind/diverged · 2 unknown
 *
 * The pure comparator (`assess`) and the orchestrator (`deploymentStatus`) are
 * exported and covered by packages/server/__tests__/scripts/deployment-status.test.ts
 * with fake fetch + git; only `main()` touches the network and the shell.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

const FULL_SHA = /^[0-9a-f]{40}$/;

/**
 * Pure verdict from already-gathered facts.
 *
 * @param {object} input
 * @param {{ ok: boolean, body?: any, error?: string }} input.health  the /health fetch outcome
 * @param {string | null} input.headSha                                the ref's head, null if unresolvable
 * @param {{ ahead: number, behind: number } | null} input.distance    rev-list counts, null if the sha is unknown to git
 */
export function assess({ health, headSha, distance }) {
  const base = {
    headSha,
    runningSha: null,
    builtAt: null,
    uptime: null,
    health: null,
  };

  if (!health.ok) {
    return { ...base, status: 'unknown', reason: 'unreachable', detail: health.error ?? null };
  }

  const body = health.body ?? {};
  const runningSha = typeof body.sha === 'string' && FULL_SHA.test(body.sha) ? body.sha : null;
  const facts = {
    ...base,
    runningSha,
    builtAt: typeof body.builtAt === 'string' ? body.builtAt : null,
    uptime: typeof body.uptime === 'number' ? body.uptime : null,
    health: typeof body.status === 'string' ? body.status : null,
  };

  if (!runningSha) {
    return {
      ...facts,
      status: 'unknown',
      reason: 'no_sha',
      detail: 'app serves sha: null — built without GIT_SHA',
    };
  }
  if (!headSha) {
    return { ...facts, status: 'unknown', reason: 'no_head', detail: 'could not resolve the ref' };
  }
  if (runningSha === headSha) {
    return { ...facts, status: 'live', behind: 0, ahead: 0 };
  }
  if (!distance) {
    return {
      ...facts,
      status: 'unknown',
      reason: 'sha_not_in_repo',
      detail: 'running sha is not in this checkout — fetch, or it was built from elsewhere',
    };
  }
  if (distance.ahead === 0 && distance.behind > 0) {
    return { ...facts, status: 'behind', behind: distance.behind, ahead: 0 };
  }
  return { ...facts, status: 'diverged', behind: distance.behind, ahead: distance.ahead };
}

/**
 * Gather the facts, then assess. Dependencies are injected so the whole path
 * is testable without a network or a git checkout.
 *
 * @param {object} opts
 * @param {string} opts.url
 * @param {string} [opts.ref]
 * @param {typeof fetch} [opts.fetchImpl]
 * @param {{ head(ref: string): Promise<string|null>, distance(from: string, to: string): Promise<{ahead:number,behind:number}|null> }} [opts.git]
 * @param {number} [opts.timeoutMs]
 */
export async function deploymentStatus({
  url,
  ref = 'origin/main',
  fetchImpl = fetch,
  git = realGit,
  timeoutMs = 5000,
}) {
  const health = await probe(healthUrl(url), fetchImpl, timeoutMs);
  const headSha = await git.head(ref);

  const runningSha = health.ok && typeof health.body?.sha === 'string' ? health.body.sha : null;
  const distance =
    runningSha && headSha && runningSha !== headSha
      ? await git.distance(runningSha, headSha)
      : null;

  return { url: healthUrl(url), ref, ...assess({ health, headSha, distance }) };
}

export function healthUrl(url) {
  const u = new URL(url);
  if (!u.pathname.replace(/\/+$/, '').endsWith('/health')) {
    u.pathname = u.pathname.replace(/\/+$/, '') + '/health';
  }
  return u.toString();
}

async function probe(url, fetchImpl, timeoutMs) {
  try {
    // A degraded app answers 503 WITH a body — the sha is still the truth, so
    // the status code alone never decides reachability.
    const res = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs) });
    const text = await res.text();
    try {
      return { ok: true, body: JSON.parse(text), httpStatus: res.status };
    } catch {
      return { ok: false, error: `non-JSON response (HTTP ${res.status})` };
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export const realGit = {
  async head(ref) {
    try {
      const { stdout } = await run('git', ['rev-parse', '--verify', `${ref}^{commit}`]);
      return stdout.trim();
    } catch {
      return null;
    }
  },
  async distance(from, to) {
    try {
      const { stdout } = await run('git', [
        'rev-list',
        '--left-right',
        '--count',
        `${from}...${to}`,
      ]);
      const [ahead, behind] = stdout.trim().split(/\s+/).map(Number);
      return { ahead, behind };
    } catch {
      return null;
    }
  },
  async fetch() {
    await run('git', ['fetch', '--quiet', 'origin']);
  },
};

function parseArgs(argv) {
  const opts = { url: null, ref: 'origin/main', fetch: false, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--ref') opts.ref = argv[++i];
    else if (a === '--fetch') opts.fetch = true;
    else if (a === '--json') opts.json = true;
    else if (a === '--help' || a === '-h') opts.help = true;
    else if (!opts.url) opts.url = a;
  }
  return opts;
}

function format(r) {
  const lines = [];
  const running = r.runningSha ? r.runningSha.slice(0, 7) : 'null';
  const head = r.headSha ? r.headSha.slice(0, 7) : 'null';
  const uptime = r.uptime == null ? '?' : humanSeconds(r.uptime);
  switch (r.status) {
    case 'live':
      lines.push(`LIVE      ${running} is ${r.ref} (uptime ${uptime}, built ${r.builtAt ?? '?'})`);
      break;
    case 'behind':
      lines.push(
        `BEHIND    ${running} is ${r.behind} commit(s) behind ${r.ref} (${head}); uptime ${uptime}`,
      );
      break;
    case 'diverged':
      lines.push(
        `DIVERGED  ${running} is ${r.ahead} ahead / ${r.behind} behind ${r.ref} (${head}); uptime ${uptime}`,
      );
      break;
    default:
      lines.push(`UNKNOWN   ${r.reason}: ${r.detail ?? ''}`.trimEnd());
      if (r.uptime != null) lines.push(`          uptime ${uptime}, health ${r.health ?? '?'}`);
  }
  if (r.health && r.health !== 'ok') lines.push(`          health: ${r.health}`);
  return lines.join('\n');
}

function humanSeconds(s) {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${(s / 3600).toFixed(1)}h`;
}

const EXIT = { live: 0, behind: 1, diverged: 1, unknown: 2 };

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help || !opts.url) {
    console.log(
      'usage: node scripts/deployment-status.mjs <url> [--ref origin/main] [--fetch] [--json]',
    );
    process.exit(opts.help ? 0 : 2);
  }
  if (opts.fetch) await realGit.fetch();
  const result = await deploymentStatus({ url: opts.url, ref: opts.ref });
  console.log(opts.json ? JSON.stringify(result, null, 2) : format(result));
  process.exit(EXIT[result.status] ?? 2);
}

const invokedDirectly =
  process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (invokedDirectly) {
  main().catch((err) => {
    console.error(err);
    process.exit(2);
  });
}
