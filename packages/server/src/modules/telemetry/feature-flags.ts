import { Injectable } from '@nestjs/common';
import { FEATURE_FLAGS, type ActiveUser, type FeatureFlag } from '@pkg/contracts';
import { Analytics } from './analytics.js';

/**
 * Resolves which feature flags are on for a user — SERVER-side, so every
 * client (including a mobile build that cannot be redeployed) receives the
 * same answer from /auth/me and needs no flag SDK of its own.
 *
 * PostHog is the evaluator when analytics is configured; without it every
 * flag is off. Only flags listed in FEATURE_FLAGS are ever returned — the
 * catalog is what the code can act on, so an unknown PostHog flag is noise,
 * not a feature.
 *
 * Deliberately behind this seam: replacing PostHog with a database table is a
 * change to this file, invisible to every client.
 */
@Injectable()
export class FeatureFlags {
  constructor(private readonly analytics: Analytics) {}

  async resolveFeatures(user: ActiveUser): Promise<FeatureFlag[]> {
    try {
      const all = await this.analytics.flagsFor(user.userId, user.orgId);
      if (!all) return [];

      return FEATURE_FLAGS.filter((flag) => all[flag] === true || typeof all[flag] === 'string');
    } catch {
      // Flag resolution must never take down /auth/me — degraded means "all off".
      return [];
    }
  }
}
