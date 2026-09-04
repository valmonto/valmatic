import type { ConfigService } from '@nestjs/config';
import type { ActiveUser } from '@pkg/contracts';
import { describe, expect, it, vi } from 'vitest';
import { Analytics } from '../../../src/modules/telemetry/analytics.js';
import { ErrorReporter } from '../../../src/modules/telemetry/error-reporting.js';
import { FeatureFlags } from '../../../src/modules/telemetry/feature-flags.js';

const configWith = (values: Record<string, string>): ConfigService =>
  ({
    get: vi.fn((key: string, fallback?: unknown) => values[key] ?? fallback),
  }) as unknown as ConfigService;

const logger = { info: vi.fn(), error: vi.fn() } as never;

const user: ActiveUser = {
  userId: '11111111-1111-4111-8111-111111111111',
  orgId: '22222222-2222-4222-8222-222222222222',
  orgRole: 'MEMBER',
  systemRole: 'USER',
};

/**
 * The contract under test is the OFF state: with no keys configured, every
 * telemetry call must be a cheap no-op — no network, no throw — because that
 * is how every MVP runs until someone pastes a key.
 */
describe('telemetry when unconfigured', () => {
  it('reports errors nowhere and does not throw', () => {
    const reporter = new ErrorReporter(configWith({}), logger);

    expect(reporter.enabled).toBe(false);
    expect(() => reporter.report(new Error('boom'), { userId: 'u1' })).not.toThrow();
  });

  it('captures analytics nowhere and does not throw', () => {
    const analytics = new Analytics(configWith({}), logger);

    expect(analytics.enabled).toBe(false);
    expect(() => analytics.capture({ userId: 'u1', event: 'logged_in' })).not.toThrow();
  });

  it('resolves every feature flag to off', async () => {
    const flags = new FeatureFlags(new Analytics(configWith({}), logger));

    await expect(flags.resolveFeatures(user)).resolves.toEqual([]);
  });
});

describe('FeatureFlags', () => {
  const analyticsAnswering = (answer: Record<string, unknown> | null) =>
    ({ flagsFor: vi.fn().mockResolvedValue(answer) }) as unknown as Analytics;

  // The catalog is what the code can act on — a flag PostHog knows and the
  // code does not must never leak into /auth/me and fail the strict schema.
  it('returns only flags the catalog knows', async () => {
    const flags = new FeatureFlags(
      analyticsAnswering({ 'example-feature': true, 'unknown-posthog-flag': true }),
    );

    await expect(flags.resolveFeatures(user)).resolves.toEqual(['example-feature']);
  });

  it('treats a variant string as on', async () => {
    const flags = new FeatureFlags(analyticsAnswering({ 'example-feature': 'variant-b' }));

    await expect(flags.resolveFeatures(user)).resolves.toEqual(['example-feature']);
  });

  it('treats false and absent as off', async () => {
    const flags = new FeatureFlags(analyticsAnswering({ 'example-feature': false }));

    await expect(flags.resolveFeatures(user)).resolves.toEqual([]);
  });

  // Flag resolution sits inside /auth/me — an unreachable PostHog must degrade
  // to "all off", never to a failed login.
  it('degrades to all-off when the evaluator throws', async () => {
    const analytics = { flagsFor: vi.fn().mockRejectedValue(new Error('posthog down')) };
    const flags = new FeatureFlags(analytics as unknown as Analytics);

    await expect(flags.resolveFeatures(user)).resolves.toEqual([]);
  });
});
