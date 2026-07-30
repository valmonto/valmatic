import { Injectable, type OnApplicationShutdown } from '@nestjs/common';
import type { PostHog } from 'posthog-node';
import { ConfigService } from '@nestjs/config';
import type { AnalyticsEvent } from '@pkg/contracts';
import { InjectLogger, PinoLogger } from '../logging';

/**
 * Server-side product analytics — the seam, not the vendor.
 *
 * POSTHOG_KEY set → events go to PostHog (EU host by default), attributed to
 * the user and grouped by organization so "which orgs use X" is answerable.
 * Unset → every call is a no-op.
 *
 * Event names come from the ANALYTICS_EVENTS catalog in @pkg/contracts, the
 * same one the clients use — one taxonomy, compile-checked.
 */
@Injectable()
export class Analytics implements OnApplicationShutdown {
  private posthog: PostHog | null = null;

  constructor(
    private readonly configService: ConfigService,
    @InjectLogger() private readonly logger: PinoLogger,
  ) {
    const key = this.configService.get<string>('POSTHOG_KEY');
    if (!key) return;

    const { PostHog: PostHogClient } =
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('posthog-node') as { PostHog: new (key: string, opts: object) => PostHog };
    this.posthog = new PostHogClient(key, {
      host: this.configService.get<string>('POSTHOG_HOST', 'https://eu.i.posthog.com'),
    });
    this.logger.info('PostHog server analytics enabled');
  }

  get enabled(): boolean {
    return this.posthog !== null;
  }

  capture(opts: {
    userId: string;
    orgId?: string;
    event: AnalyticsEvent;
    properties?: Record<string, unknown>;
  }): void {
    if (!this.posthog) return;

    this.posthog.capture({
      distinctId: opts.userId,
      event: opts.event,
      properties: opts.properties,
      groups: opts.orgId ? { organization: opts.orgId } : undefined,
    });
  }

  /**
   * Raw flag evaluation for FeatureFlags — kept here so the PostHog client has
   * exactly one owner. Returns null when analytics is not configured.
   */
  async flagsFor(userId: string, orgId: string): Promise<Record<string, unknown> | null> {
    if (!this.posthog) return null;
    return this.posthog.getAllFlags(userId, { groups: { organization: orgId } });
  }

  async onApplicationShutdown(): Promise<void> {
    await this.posthog?.shutdown();
  }
}
