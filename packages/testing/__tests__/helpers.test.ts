import { describe, expect, it } from 'vitest';
import { FakeLogger, hasDatabase } from '../src/index';

describe('FakeLogger', () => {
  it('records entries by level', () => {
    const logger = new FakeLogger();

    logger.info('started');
    logger.error('sync failed');

    expect(logger.at('info')).toHaveLength(1);
    expect(logger.at('error')).toHaveLength(1);
    expect(logger.logged('sync failed', 'error')).toBe(true);
    expect(logger.logged('never happened')).toBe(false);
  });

  it('matches text inside a logged object, as pino is called', () => {
    const logger = new FakeLogger();

    logger.warn({ err: new Error('token expired') }, 'refresh failed');

    expect(logger.logged('refresh failed')).toBe(true);
    expect(logger.logged('token expired')).toBe(true);
  });
});

describe('describeIntegration', () => {
  it('reports whether a database is configured', () => {
    expect(hasDatabase).toBe(Boolean(process.env.DATABASE_URL));
  });
});
