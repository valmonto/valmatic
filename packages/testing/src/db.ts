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
 * Suites that boot the whole app in-process — Nest, Fastify, guards, filters,
 * the throttler — and drive it over HTTP. They need everything the app needs:
 * a database AND a Redis (sessions, rate limiting, queues).
 *
 * Runs when both `DATABASE_URL` and `IAM_REDIS_HOST` are set, skips otherwise.
 * CI sets both; locally, point them at the dev containers.
 *
 * This is the layer that catches what mocks cannot: a guard the framework no
 * longer invokes, an exception filter whose body changed shape, a plugin
 * registration that fell out of the bootstrap. A framework upgrade is only
 * proven here or in a real browser.
 */
export const describeStack: typeof describe | typeof describe.skip =
  process.env.DATABASE_URL && process.env.IAM_REDIS_HOST ? describe : describe.skip;

/** True when stack suites will actually run. */
export const hasStack = Boolean(process.env.DATABASE_URL && process.env.IAM_REDIS_HOST);

/**
 * Anything exposing Drizzle's `.delete(table)`.
 *
 * The parameter is `never` so any concrete table type satisfies it — method
 * parameters are compared bivariantly, and spelling out Drizzle's builder
 * generics here would buy no safety, since the tables arrive untyped anyway.
 */
interface Deletable {
  delete: (table: never) => PromiseLike<unknown>;
}

/**
 * Empty the given tables, children first.
 *
 * Prefer this in `beforeEach` over assuming an empty database: tests that leak
 * rows into each other fail in confusing, order-dependent ways.
 *
 * @param db     a Drizzle database
 * @param tables tables in deletion order (dependents before dependencies)
 */
export async function truncate(db: Deletable, tables: unknown[]): Promise<void> {
  for (const table of tables) {
    await db.delete(table as never);
  }
}
