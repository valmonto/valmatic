import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { expect } from 'vitest';

/** Set `UPDATE_GOLDENS=1` to rewrite goldens instead of asserting against them. */
const UPDATING = process.env.UPDATE_GOLDENS === '1';

/** Where fixtures and goldens live, relative to the workspace root. */
const FIXTURES_DIR = '__tests__/__fixtures__';
const GOLDENS_DIR = '__tests__/__goldens__';

/**
 * Read a JSON fixture — recorded real-world input, kept in the repo so tests
 * are deterministic and need no network or database.
 *
 * @example const snapshots = loadFixture<Snapshot[]>('signals/sol-june.json')
 */
export function loadFixture<T = unknown>(name: string): T {
  const path = join(process.cwd(), FIXTURES_DIR, name);
  if (!existsSync(path)) {
    throw new Error(`Fixture not found: ${path}`);
  }
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

/**
 * Assert a value still matches its recorded golden, writing the file the first
 * time (or whenever `UPDATE_GOLDENS=1`).
 *
 * This is the cheapest guard against *silent behaviour drift*: pin the output
 * of something whose exact numbers matter — a report, a calculation, a
 * serialized payload — and any refactor that changes them fails loudly instead
 * of quietly producing different results.
 *
 * Review the diff before accepting an update. A golden that gets refreshed
 * without being read is worse than no golden at all: it records the bug.
 *
 * @example expectGolden('backtest/regime-sol.json', result)
 */
export function expectGolden(name: string, actual: unknown): void {
  const path = join(process.cwd(), GOLDENS_DIR, name);
  const serialized = `${JSON.stringify(actual, null, 2)}\n`;

  if (UPDATING || !existsSync(path)) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, serialized);
    if (!UPDATING) {
      console.warn(`[golden] created ${name} — review it before committing.`);
    }
    return;
  }

  expect(JSON.parse(serialized)).toEqual(JSON.parse(readFileSync(path, 'utf8')));
}
