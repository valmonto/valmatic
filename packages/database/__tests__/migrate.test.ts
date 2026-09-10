import { beforeEach, describe, expect, it, vi } from 'vitest';

const postgresMock = vi.fn(() => ({ end: vi.fn().mockResolvedValue(undefined) }));
vi.mock('postgres', () => ({ default: postgresMock }));
vi.mock('drizzle-orm/postgres-js', () => ({ drizzle: vi.fn(() => ({})) }));
vi.mock('drizzle-orm/postgres-js/migrator', () => ({
  migrate: vi.fn().mockResolvedValue(undefined),
}));

const { runMigrations } = await import('../src/migrate.js');

const CA = '-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----';
const URL_EXTERNAL = 'postgresql://u:p@198.244.200.168:35427/app?sslmode=verify-full';

function optionsOfLastCall(): Record<string, unknown> {
  return postgresMock.mock.calls.at(-1)![1] as Record<string, unknown>;
}

/**
 * The migration is the FIRST thing to touch an external database, so it is the
 * first thing to fail when TLS trust is wrong — and it used to take the URL
 * alone. A private CA cannot ride in a connection URL (see tls.ts), so
 * `?sslmode=verify-full` was checked against the system trust store and died on
 * UNABLE_TO_VERIFY_LEAF_SIGNATURE, while the app and worker — which pass the CA
 * as a JS option — connected to the very same database without complaint.
 */
describe('runMigrations TLS', () => {
  beforeEach(() => {
    postgresMock.mockClear();
  });

  it('verifies against the supplied CA when one is given', async () => {
    await runMigrations(URL_EXTERNAL, '/migrations', CA);

    const ssl = optionsOfLastCall().ssl as { ca: string; rejectUnauthorized: boolean };
    expect(ssl.ca).toBe(CA);
    expect(ssl.rejectUnauthorized).toBe(true);
  });

  /** An IP host must not set SNI — Node throws on it, from inside the driver. */
  it('does not set servername for an IP host', async () => {
    await runMigrations(URL_EXTERNAL, '/migrations', CA);

    expect(optionsOfLastCall().ssl).not.toHaveProperty('servername');
  });

  /** A container-network database has no private CA and must stay untouched. */
  it('leaves TLS alone when no CA is given', async () => {
    await runMigrations('postgresql://u:p@postgres:5432/app', '/migrations');

    expect(optionsOfLastCall()).not.toHaveProperty('ssl');
  });
});
