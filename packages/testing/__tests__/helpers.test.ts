import { describe, expect, it } from 'vitest';
import { FakeClock, FakeLogger, hasDatabase } from '../src/index';

describe('FakeClock', () => {
  it('starts at a fixed instant so tests are reproducible', () => {
    expect(new FakeClock().now().toISOString()).toBe('2026-01-01T00:00:00.000Z');
  });

  it('advances by milliseconds and by duration strings', () => {
    const clock = new FakeClock('2026-01-01T00:00:00.000Z');

    clock.advance(1_500);
    expect(clock.now().toISOString()).toBe('2026-01-01T00:00:01.500Z');

    clock.advance('5m');
    expect(clock.now().toISOString()).toBe('2026-01-01T00:05:01.500Z');

    clock.advance('2h').advance('1d');
    expect(clock.now().toISOString()).toBe('2026-01-02T02:05:01.500Z');
  });

  it('rejects an unparseable duration rather than silently doing nothing', () => {
    expect(() => new FakeClock().advance('soon')).toThrow(/Unrecognised duration/);
  });
});

describe('FakeLogger', () => {
  it('records entries by level and matches on message text', () => {
    const logger = new FakeLogger();

    logger.error('sync failed', 'WhaleSync');
    logger.log('done');

    expect(logger.at('error')).toHaveLength(1);
    expect(logger.logged('sync failed', 'error')).toBe(true);
    expect(logger.logged('never happened')).toBe(false);
  });
});

describe('describeIntegration', () => {
  it('reports whether a database is configured', () => {
    expect(hasDatabase).toBe(Boolean(process.env.DATABASE_URL));
  });
});
