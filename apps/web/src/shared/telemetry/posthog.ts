import posthog from 'posthog-js';
import type { AnalyticsEvent } from '@pkg/contracts';

/**
 * The web telemetry seam. Components call track()/identify() — never
 * posthog.* directly — so the vendor stays swappable and every event name is
 * compile-checked against the ANALYTICS_EVENTS catalog in @pkg/contracts.
 *
 * VITE_PUBLIC_POSTHOG_KEY unset → init() never runs and every call below is a
 * no-op. Covers analytics, session replay and frontend error capture in one
 * SDK; feature flags deliberately do NOT come from here — they arrive
 * server-resolved in /auth/me (see useFeature).
 */
let enabled = false;

export function initTelemetry(): void {
  const key = import.meta.env.VITE_PUBLIC_POSTHOG_KEY as string | undefined;
  if (!key) return;

  posthog.init(key, {
    api_host: (import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string) || 'https://eu.i.posthog.com',
    // Replays mask every input by default — recordings show WHERE users
    // struggle without capturing WHAT they typed.
    session_recording: { maskAllInputs: true },
    capture_exceptions: true,
  });
  enabled = true;
}

export function track(event: AnalyticsEvent, properties?: Record<string, unknown>): void {
  if (!enabled) return;
  posthog.capture(event, properties);
}

/** Ties events to the session user and groups them by organization. */
export function identify(userId: string, orgId: string): void {
  if (!enabled) return;
  posthog.identify(userId);
  posthog.group('organization', orgId);
}

/** On logout — the next visitor on this browser is not the same person. */
export function resetIdentity(): void {
  if (!enabled) return;
  posthog.reset();
}
