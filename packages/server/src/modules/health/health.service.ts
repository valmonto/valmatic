import { Inject, Injectable, Optional } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { REDIS } from '../redis/index.js';
import { readBuildInfo, type BuildInfo } from './build-info.js';

/**
 * Matches `@pkg/database`'s provider token and the slice of its client used
 * here. Declared structurally so this package need not depend on the database
 * package — apps that wire one in satisfy it, apps that do not still boot.
 */
const DATABASE_CLIENT = 'DATABASE_CLIENT';

interface PingableDatabase {
  sql: (template: TemplateStringsArray, ...values: unknown[]) => Promise<unknown>;
}

export type HealthStatus = 'ok' | 'degraded';

export interface HealthReport extends BuildInfo {
  status: HealthStatus;
  timestamp: string;
  /** Seconds since this process started — drops to ~0 when a container is actually replaced. */
  uptime: number;
}

/** How long a dependency probe result is reused before re-checking. */
const CACHE_TTL_MS = 10_000;
/** A probe that hangs is a failed probe — never let it stall the response. */
const PROBE_TIMEOUT_MS = 2_000;

/**
 * Reports whether the process can actually serve traffic, not merely that it
 * started.
 *
 * Both clients are optional so the module works in any app: an app that wires
 * neither gets a plain liveness answer.
 *
 * The result is cached, which is what makes a public endpoint safe to expose —
 * without it, an unauthenticated URL that triggers a database round trip is a
 * cheap way to generate load. Probes are also bounded: postgres.js connects
 * lazily, so an unreachable host shows up as a hanging query rather than an
 * immediate error.
 */
@Injectable()
export class HealthService {
  private readonly startTime = Date.now();
  /** Read once: env cannot change under a running container. */
  private readonly build = readBuildInfo();
  private cached?: { at: number; status: HealthStatus };
  /** In-flight probe, shared by concurrent callers so a burst causes one check. */
  private inFlight?: Promise<HealthStatus>;

  constructor(
    @Optional() @Inject(DATABASE_CLIENT) private readonly database?: PingableDatabase,
    @Optional() @Inject(REDIS) private readonly redis?: Redis,
  ) {}

  async check(): Promise<HealthReport> {
    return {
      status: await this.dependencyStatus(),
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      ...this.build,
    };
  }

  private dependencyStatus(): Promise<HealthStatus> {
    const now = Date.now();
    if (this.cached && now - this.cached.at < CACHE_TTL_MS) {
      return Promise.resolve(this.cached.status);
    }
    // Without this, a burst of concurrent requests each starts its own probe —
    // the cache alone only collapses *sequential* calls.
    if (this.inFlight) return this.inFlight;

    this.inFlight = Promise.all([this.probeDatabase(), this.probeRedis()])
      .then((probes): HealthStatus => {
        const status: HealthStatus = probes.every(Boolean) ? 'ok' : 'degraded';
        this.cached = { at: Date.now(), status };
        return status;
      })
      .finally(() => {
        this.inFlight = undefined;
      });

    return this.inFlight;
  }

  private async probeDatabase(): Promise<boolean> {
    if (!this.database) return true;
    return withTimeout(this.database.sql`select 1`.then(() => true));
  }

  private async probeRedis(): Promise<boolean> {
    if (!this.redis) return true;
    return withTimeout(this.redis.ping().then(() => true));
  }
}

async function withTimeout(probe: Promise<boolean>): Promise<boolean> {
  const timeout = new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => resolve(false), PROBE_TIMEOUT_MS);
    timer.unref?.();
  });

  try {
    return await Promise.race([probe, timeout]);
  } catch {
    return false;
  }
}
