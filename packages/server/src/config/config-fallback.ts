import type { ConfigService } from '@nestjs/config';

/**
 * `primary` if it is set, else `shared`, else `fallback` — for a setting that
 * has its own name and a shared one, e.g. IAM_REDIS_HOST → REDIS_HOST.
 *
 * The env schema must NOT give `primary` (or `shared`) a default: a default
 * always counts as set, so the fallback would never be reached. Put the
 * default here instead.
 */
export const configWithFallback = <T>(
  config: ConfigService,
  primary: string,
  shared: string,
  fallback?: T,
): T | undefined => config.get<T>(primary) ?? config.get<T>(shared) ?? fallback;
