import { Injectable } from '@nestjs/common';
import type * as SentryTypes from '@sentry/node';
import { ConfigService } from '@nestjs/config';
import { InjectLogger, PinoLogger } from '../logging/index.js';

export interface ErrorContext {
  userId?: string;
  orgId?: string;
  method?: string;
  path?: string;
}

/**
 * The one seam backend errors pass through on their way out of the process.
 *
 * SENTRY_DSN set → initialises Sentry and forwards there with request context.
 * Unset → does nothing beyond what pino already logs, at zero cost.
 *
 * Feature code never imports @sentry/* — swapping the vendor (GlitchTip
 * speaks the same DSN protocol) or removing it entirely is a change to this
 * file and an env var, nothing else.
 */
@Injectable()
export class ErrorReporter {
  private sentry: typeof SentryTypes | null = null;

  constructor(
    private readonly configService: ConfigService,
    @InjectLogger() private readonly logger: PinoLogger,
  ) {
    const dsn = this.configService.get<string>('SENTRY_DSN');
    if (!dsn) return;

    // Required (not import()) keeps construction synchronous; the module is
    // only loaded at all when a DSN is configured.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sentry = require('@sentry/node') as typeof SentryTypes;
    sentry.init({
      dsn,
      environment: this.configService.get<string>('NODE_ENV', 'development'),
      // Errors only — tracing is a separate, costed decision.
      tracesSampleRate: 0,
    });
    this.sentry = sentry;
    this.logger.info('Sentry error reporting enabled');
  }

  get enabled(): boolean {
    return this.sentry !== null;
  }

  report(error: unknown, context: ErrorContext = {}): void {
    if (!this.sentry) return;

    this.sentry.withScope((scope) => {
      if (context.userId) scope.setUser({ id: context.userId });
      if (context.orgId) scope.setTag('orgId', context.orgId);
      if (context.path) scope.setTag('path', context.path);
      if (context.method) scope.setTag('method', context.method);
      this.sentry!.captureException(error);
    });
  }
}
