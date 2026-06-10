import type { LoggerService } from '@nestjs/common';

/**
 * NestJS's own internal logger contexts — the noisy bootstrap output
 * (module wiring, route mappings, the path-to-regexp legacy warning, …).
 */
const FRAMEWORK_CONTEXTS = new Set([
  'NestFactory',
  'NestApplication',
  'InstanceLoader',
  'RoutesResolver',
  'RouterExplorer',
  'LegacyRouteConverter',
  'WebSocketsController',
  'NestMicroservice',
]);

/**
 * Wrap a {@link LoggerService} so messages from NestJS framework contexts are
 * dropped — unless `LOG_FRAMEWORK=true`, which passes everything through for
 * debugging.
 *
 * Only the framework's own logs (and anything routed through the global
 * `LoggerService`) are affected; your app's `@InjectLogger()` / `PinoLogger`
 * calls go straight to pino and never touch this filter. `error`/`fatal` always
 * pass so bootstrap failures stay visible.
 */
export function withFrameworkLogFilter(base: LoggerService): LoggerService {
  if (process.env.LOG_FRAMEWORK === 'true') return base;

  const isFramework = (params: unknown[]): boolean =>
    typeof params[params.length - 1] === 'string' &&
    FRAMEWORK_CONTEXTS.has(params[params.length - 1] as string);

  const gate =
    (method?: (message: unknown, ...params: unknown[]) => void) =>
    (message: unknown, ...params: unknown[]): void => {
      if (method && !isFramework(params)) method.call(base, message, ...params);
    };

  return {
    log: gate(base.log?.bind(base)),
    warn: gate(base.warn?.bind(base)),
    debug: base.debug ? gate(base.debug.bind(base)) : undefined,
    verbose: base.verbose ? gate(base.verbose.bind(base)) : undefined,
    // Always surface errors, even from the framework.
    error: base.error?.bind(base),
    fatal: base.fatal?.bind(base),
  };
}
