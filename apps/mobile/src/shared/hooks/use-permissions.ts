import { type Permission } from '@pkg/contracts';
import { useMemo } from 'react';
import { useAuthStore } from '@/shared/auth/auth-store';

/**
 * Permission checks read the list the API resolved and sent with the current
 * user, rather than deriving it from the role here.
 *
 * That matters more on mobile than on web: an installed build cannot be
 * redeployed on demand, so a client holding its own copy of the permission
 * table would keep answering from it for as long as the user stays on that
 * version. Reading the served list means a change reaches even an old build on
 * its next request.
 *
 * None of this is enforcement. The API decides; these decide what to render.
 */
function useGranted(): readonly Permission[] {
  const permissions = useAuthStore((s) => s.user?.permissions);
  const loading = useAuthStore((s) => s.status === 'loading');
  return loading ? [] : (permissions ?? []);
}

/** Whether the current user has a specific permission. */
export function useCan(permission: Permission): boolean {
  const granted = useGranted();
  return useMemo(() => granted.includes(permission), [granted, permission]);
}

/** Whether the current user has ANY of the permissions. */
export function useCanAny(permissions: Permission[]): boolean {
  const granted = useGranted();
  return useMemo(
    () => permissions.length > 0 && permissions.some((p) => granted.includes(p)),
    [granted, permissions],
  );
}

/** Whether the current user has ALL of the permissions. */
export function useCanAll(permissions: Permission[]): boolean {
  const granted = useGranted();
  return useMemo(
    () => permissions.length > 0 && permissions.every((p) => granted.includes(p)),
    [granted, permissions],
  );
}

/** All permissions granted to the current user in the active organization. */
export function usePermissions(): readonly Permission[] {
  return useGranted();
}

/** The current user's role (or null while loading / logged out). */
export function useRole() {
  const role = useAuthStore((s) => s.user?.role);
  const loading = useAuthStore((s) => s.status === 'loading');
  return loading ? null : (role ?? null);
}
