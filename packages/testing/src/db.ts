import { describe } from 'vitest';

/**
 * Integration suites that need a real database.
 *
 * Runs when `DATABASE_URL` is set, and is skipped — not failed — when it is
 * not. That keeps `pnpm verify` hermetic and parallel-safe by default (a fresh
 * clone, a CI checkout or several agents in worktrees all pass without any
 * service running), while still exercising real SQL wherever a database is
 * available.
 *
 * @example
 * describeIntegration('UserRepository', () => {
 *   it('persists a user', async () => { ... })
 * })
 */
export const describeIntegration: typeof describe | typeof describe.skip = process.env.DATABASE_URL
  ? describe
  : describe.skip;

/** True when integration suites will actually run. */
export const hasDatabase = Boolean(process.env.DATABASE_URL);

/**
 * Empty the given tables, children first.
 *
 * Prefer this in `beforeEach` over assuming an empty database: tests that leak
 * rows into each other fail in confusing, order-dependent ways.
 *
 * @param db     anything exposing Drizzle's `.delete(table)`
 * @param tables tables in deletion order (dependents before dependencies)
 */
export async function truncate(
  db: { delete: (table: unknown) => { execute?: () => Promise<unknown> } | Promise<unknown> },
  tables: unknown[],
): Promise<void> {
  for (const table of tables) {
    const query = db.delete(table);
    await (typeof (query as { execute?: unknown }).execute === 'function'
      ? (query as { execute: () => Promise<unknown> }).execute()
      : (query as Promise<unknown>));
  }
}
