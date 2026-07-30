import type { FeatureFlag } from '@pkg/contracts';
import { useAuthStore } from '@/shared/auth/auth-store';

/**
 * Whether a feature flag is on for the current user.
 *
 * Reads the server-resolved list from /auth/me — no flag SDK in the app, which
 * matters most here: a shipped mobile build cannot be redeployed, so flags
 * must always arrive from the API. Mirrors the web hook exactly.
 */
export function useFeature(flag: FeatureFlag): boolean {
  const features = useAuthStore((s) => s.user?.features);
  const loading = useAuthStore((s) => s.status === 'loading');
  return loading ? false : (features?.includes(flag) ?? false);
}
