import { Global, Module } from '@nestjs/common';
import { Analytics } from './analytics';
import { ErrorReporter } from './error-reporting';
import { FeatureFlags } from './feature-flags';

/**
 * Telemetry — sleeping by default, woken by env vars:
 *
 *   SENTRY_DSN   → backend errors to Sentry (ErrorReporter)
 *   POSTHOG_KEY  → product analytics + feature flags (Analytics, FeatureFlags)
 *
 * Neither set → every service is a no-op and nothing leaves the process.
 * Global so the exception filter and any feature service can inject without
 * per-module imports.
 */
@Global()
@Module({
  providers: [ErrorReporter, Analytics, FeatureFlags],
  exports: [ErrorReporter, Analytics, FeatureFlags],
})
export class TelemetryModule {}
