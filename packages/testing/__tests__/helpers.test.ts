import { describe, expect, it } from 'vitest';
import { FakeClock, FakeHttpClient, FakeLogger, hasDatabase } from '../src/index';

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

describe('FakeHttpClient', () => {
  it('returns the registered body and records the call', async () => {
    const http = new FakeHttpClient().on('/api/users', [{ id: 1 }]);

    await expect(http.get('/api/users')).resolves.toEqual([{ id: 1 }]);
    expect(http.callsTo('/api/users')).toHaveLength(1);
    expect(http.requests[0]?.method).toBe('GET');
  });

  it('passes the request to a function responder', async () => {
    const http = new FakeHttpClient().on('/echo', (req) => req.body);

    await expect(http.post('/echo', { hello: 'world' })).resolves.toEqual({ hello: 'world' });
  });

  it('throws for unregistered URLs instead of returning undefined', async () => {
    await expect(new FakeHttpClient().get('/nope')).rejects.toThrow(/no handler for GET \/nope/);
  });

  it('can simulate a failing endpoint', async () => {
    const http = new FakeHttpClient().onError('/flaky', 'upstream exploded');

    await expect(http.get('/flaky')).rejects.toThrow('upstream exploded');
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
