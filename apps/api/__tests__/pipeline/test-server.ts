import type { INestApplication } from '@nestjs/common';
import type { AddressInfo } from 'node:net';

export interface InjectRequest {
  method: string;
  /** Path and query string, e.g. `/api/auth/me`. */
  url: string;
  headers?: Record<string, string>;
  /** An object is sent as JSON; a string goes out as-is. */
  payload?: unknown;
}

export interface InjectResponse {
  statusCode: number;
  /** Lower-case names; `set-cookie` is an array when there are several. */
  headers: Record<string, string | string[]>;
  body: string;
  /** The `name=value` of each Set-Cookie. */
  cookies: Array<{ name: string; value: string }>;
  json<T = unknown>(): T;
}

export interface TestServer {
  inject(request: InjectRequest): Promise<InjectResponse>;
  close(): Promise<void>;
}

/**
 * Serves the app on a random port on 127.0.0.1 and calls it with Node's own
 * `fetch`: the same HTTP server production runs, not a simulated request, and
 * no client library. Works on any Nest adapter — Fastify's `app.inject()`,
 * which this replaces, exists only on Fastify. Keeps `inject()`'s shape so the
 * suites read as before.
 */
export async function serve(app: INestApplication): Promise<TestServer> {
  await app.listen(0, '127.0.0.1');
  const { port } = app.getHttpServer().address() as AddressInfo;
  const base = `http://127.0.0.1:${port}`;

  return {
    async inject({ method, url, headers = {}, payload }) {
      const sent: Record<string, string> = { ...headers };
      let body: string | undefined;
      if (typeof payload === 'string') {
        body = payload;
      } else if (payload !== undefined) {
        body = JSON.stringify(payload);
        if (!Object.keys(sent).some((name) => name.toLowerCase() === 'content-type')) {
          sent['content-type'] = 'application/json';
        }
      }

      const res = await fetch(`${base}${url}`, { method, headers: sent, body, redirect: 'manual' });
      const text = await res.text();
      const setCookie = res.headers.getSetCookie();
      const received: Record<string, string | string[]> = {};
      res.headers.forEach((value, name) => {
        if (name !== 'set-cookie') received[name] = value;
      });
      if (setCookie.length > 0) {
        received['set-cookie'] = setCookie.length === 1 ? setCookie[0]! : setCookie;
      }

      return {
        statusCode: res.status,
        headers: received,
        body: text,
        cookies: setCookie.map((line) => {
          const pair = line.split(';', 1)[0]!;
          const eq = pair.indexOf('=');
          return { name: pair.slice(0, eq).trim(), value: pair.slice(eq + 1).trim() };
        }),
        json: <T>() => JSON.parse(text) as T,
      };
    },
    close: () => app.close(),
  };
}
