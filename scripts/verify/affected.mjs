#!/usr/bin/env node
// Affected-aware verify: run typecheck / lint / test only for the workspaces
// that changed since a base ref PLUS everything downstream of them, and skip
// the database when no DB-backed suite is in scope.
//
// This is a LOCAL fast-feedback tool, not the authoritative gate. The full
// `pnpm verify` (which CI runs on every PR, with a database) is what actually
// clears a merge. See CLAUDE.md "Definition of done" for the local-fast /
// CI-full split and the escalate-on-shared-package rule.
//
// The affected set is: packages that own a changed file, PLUS every package
// that (transitively) depends on one of them. So a shared-package change
// (@pkg/contracts, @pkg/database, @pkg/server, @pkg/locales) fans out to
// api/web/worker/…; a leaf apps/web-only change resolves to just @pkg/web.
//
// Why not pnpm's built-in `--filter "...[<base>]"`? Its git-based change
// detection returns NOTHING inside a linked git worktree (`.git` is a file,
// not a directory) — and build agents run in exactly such worktrees. So we
// resolve the graph from `git diff` (git itself works fine in worktrees) and
// pass explicit `--filter <name>` args to pnpm.
//
// Override the base ref with VERIFY_BASE (default: origin/main).

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.VERIFY_BASE || 'origin/main';

// Workspaces whose suites talk to Postgres — they use `describeIntegration`,
// which only runs when DATABASE_URL is set. Any shared-package change fans out
// to api/worker, so those land here automatically: that IS the escalate-on-
// shared-package rule, expressed in the dependency graph.
const DB_BACKED = new Set(['@pkg/api', '@pkg/worker', '@pkg/testing']);

// Root-level files that affect the whole monorepo when they change, so a change
// to one forces every package into the affected set (conservative — CI is still
// the real gate). NOTE: the root package.json is deliberately NOT here: by repo
// convention dependency versions live in the pnpm-workspace catalog, so root
// package.json edits are script/tooling changes that don't affect compilation.
const ROOT_WIDE = new Set([
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  '.npmrc',
  'tsconfig.json',
  'tsconfig.base.json',
]);

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

// Repo root (absolute) — changed-file paths from git are relative to it.
const root = git(['rev-parse', '--show-toplevel']);

// --- 1. Discover every workspace package (apps/*, packages/*). ---------------
const pkgs = new Map(); // name -> { dir (relative), deps: Set<name> }
for (const group of ['apps', 'packages']) {
  const groupDir = join(root, group);
  if (!existsSync(groupDir)) continue;
  for (const entry of readdirSync(groupDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const manifest = join(groupDir, entry.name, 'package.json');
    if (!existsSync(manifest)) continue;
    const json = JSON.parse(readFileSync(manifest, 'utf8'));
    if (!json.name) continue;
    const deps = Object.keys({ ...json.dependencies, ...json.devDependencies }).filter((d) =>
      d.startsWith('@pkg/'),
    );
    pkgs.set(json.name, {
      dir: `${group}/${entry.name}`,
      deps: new Set(deps),
    });
  }
}

// --- 2. Which files changed since BASE? -------------------------------------
let changedFiles;
try {
  const tracked = git(['diff', '--name-only', BASE, '--']);
  const untracked = git(['ls-files', '--others', '--exclude-standard']);
  changedFiles = [...tracked.split('\n'), ...untracked.split('\n')]
    .map((f) => f.trim())
    .filter(Boolean);
} catch (err) {
  process.stderr.write(
    `Could not diff against ${BASE}: ${err.message}\n` +
      `Make sure the base ref exists (e.g. run \`git fetch origin\`), ` +
      `or set VERIFY_BASE.\n`,
  );
  process.exit(1);
}

// --- 3. Map changed files -> owning package (or root-wide). ------------------
const changedPkgs = new Set();
let rootWideHit = null;
for (const file of changedFiles) {
  let owner = null;
  for (const [name, { dir }] of pkgs) {
    if (file === dir || file.startsWith(`${dir}/`)) {
      owner = name;
      break;
    }
  }
  if (owner) {
    changedPkgs.add(owner);
  } else if (ROOT_WIDE.has(file)) {
    rootWideHit = file;
  }
  // Other root files (README, scripts/, .github/, docs) don't map to a package.
}

if (rootWideHit) {
  process.stdout.write(`Root-wide change detected (${rootWideHit}) — verifying ALL workspaces.\n`);
  for (const name of pkgs.keys()) changedPkgs.add(name);
}

// --- 4. Fan out to dependents (transitive reverse-dependency closure). ------
// dependents.get(X) = packages that directly depend on X.
const dependents = new Map();
for (const name of pkgs.keys()) dependents.set(name, new Set());
for (const [name, { deps }] of pkgs) {
  for (const dep of deps) {
    if (dependents.has(dep)) dependents.get(dep).add(name);
  }
}

const affected = new Set(changedPkgs);
const queue = [...changedPkgs];
while (queue.length) {
  const cur = queue.pop();
  for (const dependent of dependents.get(cur) ?? []) {
    if (!affected.has(dependent)) {
      affected.add(dependent);
      queue.push(dependent);
    }
  }
}

// --- 5. Report + run. -------------------------------------------------------
if (affected.size === 0) {
  process.stdout.write(
    `verify:affected — no workspaces changed since ${BASE}; nothing to verify.\n` +
      `(If that is unexpected, check VERIFY_BASE or fetch the base ref.)\n`,
  );
  process.exit(0);
}

const affectedList = [...affected].sort();
process.stdout.write(`verify:affected — base ${BASE}\n`);
process.stdout.write(`Affected workspaces (${affectedList.length}): ${affectedList.join(', ')}\n`);

const needsDb = affectedList.some((name) => DB_BACKED.has(name));
if (needsDb && !process.env.DATABASE_URL) {
  process.stdout.write(
    '\n⚠ DB-backed suites are affected (api/worker/testing) but DATABASE_URL is unset.\n' +
      '  Integration tests (`describeIntegration`) will SKIP, so this run proves less.\n' +
      '  For full local confidence, escalate to the authoritative gate with a database:\n' +
      '    DATABASE_URL=postgresql://valmatic:valmatic@127.0.0.1:5432/valmatic_test pnpm verify\n' +
      '  CI always runs the full `pnpm verify` with a database — that is the gate that clears merge.\n',
  );
} else if (!needsDb) {
  process.stdout.write('No DB-backed workspace affected — skipping the database.\n');
}

const scope = affectedList.flatMap((name) => ['--filter', name]);

function run(label, args) {
  process.stdout.write(`\n▶ ${label}: pnpm ${args.join(' ')}\n`);
  try {
    execFileSync('pnpm', args, { stdio: 'inherit' });
  } catch {
    process.stderr.write(`\n✖ ${label} failed\n`);
    process.exit(1);
  }
}

// pnpm silently skips selected packages that lack the script, and exits 0 if
// none define it — so passing the whole affected set to each gate is safe.
// lint excludes @pkg/mobile to match the root `lint` script; test serializes
// (--workspace-concurrency=1) because api and worker share the one test DB.
run('typecheck', [...scope, 'run', 'typecheck']);
run('lint', [...scope, '--filter', '!@pkg/mobile', 'run', 'lint']);
run('test', [...scope, '--workspace-concurrency=1', 'run', 'test']);

process.stdout.write('\n✔ verify:affected passed\n');
