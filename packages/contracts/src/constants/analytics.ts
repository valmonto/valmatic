/**
 * The analytics event catalog — the single source of event names.
 *
 * Every `track()` call on web, mobile or the server takes a name from here, so
 * a renamed event is a compile error rather than a silently broken funnel, and
 * the taxonomy stays identical across clients.
 *
 * Zod-free on purpose: this file ships in frontend bundles.
 */
export const ANALYTICS_EVENTS = {
  // Auth lifecycle
  SIGNED_UP: 'signed_up',
  LOGGED_IN: 'logged_in',
  LOGGED_OUT: 'logged_out',

  // Organization lifecycle
  ORG_CREATED: 'org_created',
  ORG_SWITCHED: 'org_switched',

  // Add product events here as features ship. Delete the ones you stop
  // emitting — a catalog entry nothing sends is a funnel that reads as broken.
} as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

/**
 * Feature flags the application understands.
 *
 * Flags are evaluated SERVER-side (PostHog when configured, empty otherwise)
 * and delivered to clients in `/auth/me` as `features` — beside `permissions`,
 * never mixed into it. A flag PostHog reports that is not listed here is
 * ignored: this list is what the code can actually act on.
 */
export const FEATURE_FLAGS = [
  // Replace with real flags as features ship dark. Kept non-empty so the
  // wiring stays demonstrably alive.
  'example-feature',
] as const;

export type FeatureFlag = (typeof FEATURE_FLAGS)[number];
