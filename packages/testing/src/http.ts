/** One recorded outbound call. */
export interface RecordedRequest {
  method: string;
  url: string;
  body?: unknown;
  headers?: Record<string, string>;
}

type Responder = (req: RecordedRequest) => unknown;

/**
 * A stand-in for an outbound HTTP client: queue responses per URL, then assert
 * on what was actually requested.
 *
 * Tests that hit the network are slow, flaky, rate-limited, and impossible to
 * run concurrently — which matters as soon as several suites (or agents) run at
 * once. Register handlers for the URLs under test; anything unregistered throws
 * loudly rather than silently returning undefined.
 */
export class FakeHttpClient {
  readonly requests: RecordedRequest[] = [];
  private readonly handlers = new Map<string, Responder>();

  /** Respond to `url` by deriving the body from the request. */
  on(url: string, responder: Responder): this;
  /** Respond to `url` with a fixed body. */
  on(url: string, body: unknown): this;
  on(url: string, body: unknown): this {
    this.handlers.set(url, typeof body === 'function' ? (body as Responder) : () => body);
    return this;
  }

  /** Respond to `url` by throwing — for exercising failure paths. */
  onError(url: string, error: Error | string): this {
    this.handlers.set(url, () => {
      throw typeof error === 'string' ? new Error(error) : error;
    });
    return this;
  }

  async request<T>(req: RecordedRequest): Promise<T> {
    this.requests.push(req);
    const handler = this.handlers.get(req.url);
    if (!handler) {
      throw new Error(
        `FakeHttpClient: no handler for ${req.method} ${req.url}. ` +
          `Register one with .on(${JSON.stringify(req.url)}, …).`,
      );
    }
    return handler(req) as T;
  }

  get<T>(url: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>({ method: 'GET', url, headers });
  }

  post<T>(url: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>({ method: 'POST', url, body, headers });
  }

  /** Every call made to `url`, in order. */
  callsTo(url: string): RecordedRequest[] {
    return this.requests.filter((r) => r.url === url);
  }

  reset(): void {
    this.requests.length = 0;
    this.handlers.clear();
  }
}
