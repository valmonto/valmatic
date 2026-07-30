import type { FeatureFlag } from '@pkg/contracts';
import { useAuth } from '@/shared/auth/auth-context';

/**
 * Whether a feature flag is on for the current user.
 *
 * Reads the server-resolved list from /auth/me — the same delivery permissions
 * use, and for the same reason: one source of truth that reaches every client
 * on its next request, with no flag SDK in the bundle. Mirrors the mobile
 * hook exactly.
 */
export function useFeature(flag: FeatureFlag): boolean {
  const { user, isLoading } = useAuth();
  return isLoading ? false : (user?.features.includes(flag) ?? false);
}
