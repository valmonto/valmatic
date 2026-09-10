import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const postgresMock = vi.fn(() => ({ end: vi.fn().mockResolvedValue(undefined) }));
vi.mock('postgres', () => ({ default: postgresMock }));
vi.mock('drizzle-orm/postgres-js', () => ({ drizzle: vi.fn(() => ({})) }));

const { createDatabaseClientFromEnv } = await import('../src/client.js');

const CA = '-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----';

function optionsOfLastCall(): Record<string, unknown> {
  return postgresMock.mock.calls.at(-1)![1] as Record<string, unknown>;
}

/**
 * The env factory is exported for callers that have nothing but the
 * environment — scripts, CLIs, anything outside Nest's DI. It used to build a
 * client WITHOUT the CA while the Nest factory beside it read one, so the same
 * database reached two ways would verify in one and fail in the other with
 * UNABLE_TO_VERIFY_LEAF_SIGNATURE. A private CA cannot ride in DATABASE_URL.
 */
describe('createDatabaseClientFromEnv', () => {
  const saved = { ...process.env };

  beforeEach(() => {
    postgresMock.mockClear();
    process.env.DATABASE_URL = 'postgresql://u:p@198.244.200.168:35427/app?sslmode=verify-full';
    delete process.env.DATABASE_CA_CERT;
  });

  afterEach(() => {
    process.env = { ...saved };
  });

  it('verifies against DATABASE_CA_CERT when the environment carries one', () => {
    process.env.DATABASE_CA_CERT = CA;

    createDatabaseClientFromEnv();

    const ssl = optionsOfLastCall().ssl as { ca: string; rejectUnauthorized: boolean };
    expect(ssl.ca).toBe(CA);
    expect(ssl.rejectUnauthorized).toBe(true);
  });

  it('leaves TLS alone when the environment carries no CA', () => {
    createDatabaseClientFromEnv();

    expect(optionsOfLastCall()).not.toHaveProperty('ssl');
  });
});
