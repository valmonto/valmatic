import { createServer, request as httpRequest, type Server } from 'node:http';
import { createRequire } from 'node:module';
import type { AddressInfo } from 'node:net';
import type { ConfigService } from '@nestjs/config';
import type * as SentryTypes from '@sentry/node';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { ErrorReporter } from '../../../src/modules/telemetry/error-reporting.js';

/**
 * What Sentry is actually sent, with SENTRY_DSN set: a fake ingest server
 * receives the envelopes, and the error is reported from inside a real HTTP
 * request that carries a session cookie, a Bearer token, a query string and a
 * password body. None of it may leave the process; the stack and the context
 * report() adds must.
 *
 * Today Sentry attaches no request at all here (that takes its OpenTelemetry
 * instrumentation, loaded with --import, which we do not use), so the second
 * test pins the guard for the day someone turns it on: Sentry 11 collects
 * cookies, headers, bodies and query strings by default unless told not to.
 */
const COOKIE = 'accessToken=s%3Aeyj.cookie-secret-value';
const BEARER = 'Bearer eyj.bearer-secret-value';
const PASSWORD = 'hunter2-password-value';
const QUERY = 'token=query-secret-value';

const envelopes: string[] = [];
let ingest: Server;
let app: Server;
let reporter: ErrorReporter;
// The same module instance ErrorReporter loads (it uses createRequire too).
const sentry = createRequire(import.meta.url)('@sentry/node') as typeof SentryTypes;

const listen = (server: Server) =>
  new Promise<number>((resolve) =>
    server.listen(0, '127.0.0.1', () => resolve((server.address() as AddressInfo).port)),
  );

beforeAll(async () => {
  ingest = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => {
      envelopes.push(Buffer.concat(chunks).toString('utf8'));
      res.writeHead(200).end('{}');
    });
  });
  const ingestPort = await listen(ingest);

  const values: Record<string, string> = {
    SENTRY_DSN: `http://publickey@127.0.0.1:${ingestPort}/1`,
    NODE_ENV: 'test',
  };
  const config = {
    get: vi.fn((key: string, fallback?: unknown) => values[key] ?? fallback),
  } as unknown as ConfigService;
  reporter = new ErrorReporter(config, { info: vi.fn(), error: vi.fn() } as never);

  // Created after init, so Sentry's HTTP integration sees its requests.
  app = createServer((req, res) => {
    req.resume();
    req.on('end', () => {
      reporter.report(new Error('boom in a request'), {
        userId: 'user-123',
        orgId: 'org-456',
        method: 'POST',
        path: '/api/auth/login',
      });
      res.writeHead(500).end();
    });
  });
});

afterAll(async () => {
  await sentry.close(2000);
  await new Promise((r) => app.close(r));
  await new Promise((r) => ingest.close(r));
});

describe('ErrorReporter with a DSN (Sentry 11)', () => {
  it('sends the error with our context and none of the request’s secrets', async () => {
    expect(reporter.enabled).toBe(true);
    const port = await listen(app);

    await new Promise<void>((resolve, reject) => {
      const body = JSON.stringify({ email: 'a@b.test', password: PASSWORD });
      const req = httpRequest(
        {
          host: '127.0.0.1',
          port,
          method: 'POST',
          path: `/api/auth/login?${QUERY}`,
          headers: {
            cookie: COOKIE,
            authorization: BEARER,
            'content-type': 'application/json',
            'content-length': Buffer.byteLength(body),
          },
        },
        (res) => {
          res.resume();
          res.on('end', resolve);
        },
      );
      req.on('error', reject);
      req.end(body);
    });
    await sentry.flush(3000);

    const sent = envelopes.join('\n');
    expect(sent).toContain('boom in a request');
    expect(sent).toContain('user-123');
    expect(sent).toContain('org-456');
    for (const secret of [
      'cookie-secret-value',
      'bearer-secret-value',
      PASSWORD,
      'query-secret-value',
    ]) {
      expect(sent, secret).not.toContain(secret);
    }
  });

  it('runs Sentry with every automatic data collection switched off', () => {
    expect(sentry.getClient()?.getOptions().dataCollection).toEqual({
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      graphQL: { document: false, variables: false },
      genAI: { inputs: false, outputs: false },
      mcp: { inputs: false, outputs: false },
      databaseQueryData: false,
      queues: false,
      stackFrameVariables: false,
    });
  });
});
