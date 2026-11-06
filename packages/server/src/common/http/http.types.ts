import type { IncomingHttpHeaders } from 'node:http';

/**
 * What app code reads from a request, on any Nest HTTP adapter. Controllers,
 * guards and filters type their `@Req()` against this instead of the
 * adapter's own request type, so switching adapters (Fastify → Nest's Node
 * adapter) touches the bootstrap, not every route.
 */
export interface HttpRequest {
  method: string;
  /** Path and query string, as sent. */
  url: string;
  headers: IncomingHttpHeaders;
  /** Client address; read from X-Forwarded-For only when TRUST_PROXY is on. */
  ip?: string;
  body?: unknown;
  query?: unknown;
  params?: unknown;
}

/**
 * The adapter's response object, kept opaque on purpose: write to it through
 * `HttpAdapterHost` (`setCookie`, `setHeader`, `status`, `reply`), which works
 * the same on every adapter.
 */
export type HttpResponse = object;
