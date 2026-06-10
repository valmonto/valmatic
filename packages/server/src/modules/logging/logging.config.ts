import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Params } from 'nestjs-pino';

export interface LoggingOptions {
  /** Render each log on a single line (pino-pretty) in development. */
  singleLine?: boolean;
}

/**
 * Standard pino logging params shared by all apps (API, worker, …).
 *
 * - pretty, debug-level logs in development; raw JSON, info-level in production
 * - request id from `x-request-id` (or a generated uuid)
 * - trimmed req/res serializers and redacted auth headers
 */
export function createLoggingParams({ singleLine = false }: LoggingOptions = {}): Params {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    assignResponse: true,
    pinoHttp: {
      level: isProduction ? 'info' : 'debug',
      transport: isProduction
        ? undefined
        : {
            target: 'pino-pretty',
            options: {
              singleLine,
              ignore: 'pid,hostname',
            },
          },
      genReqId: (req) => (req.headers['x-request-id'] as string) ?? randomUUID(),
      serializers: {
        req(req: IncomingMessage & { id?: string; raw?: { url?: string; method?: string } }) {
          return {
            id: req.id,
            method: req.method ?? req.raw?.method,
            url: req.url ?? req.raw?.url,
            headers: {
              host: req.headers?.['host'],
              'content-type': req.headers?.['content-type'],
              'user-agent': req.headers?.['user-agent'],
            },
          };
        },
        res(res: ServerResponse & { statusCode?: number }) {
          return {
            statusCode: res.statusCode,
            headers: {
              'content-type': res.getHeader?.('content-type'),
              'content-length': res.getHeader?.('content-length'),
            },
          };
        },
      },
      redact: {
        paths: ['req.headers.authorization', 'req.headers.cookie', 'req.headers["set-cookie"]'],
        censor: '[REDACTED]',
      },
    },
  };
}
