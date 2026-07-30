import { useMemo } from 'react';
import { useAuth } from '@/shared/auth/auth-context';
import type { OrganizationUserRole, Permission, SystemRole } from '@pkg/contracts';

/**
 * Permission checks read the list the API resolved and sent with the current
 * user, rather than deriving it from the role here.
 *
 * That keeps the permission table out of the bundle: changing what a role can do
 * takes effect on the next request with no rebuild — which matters most for
 * clients that cannot be redeployed on demand.
 *
 * None of this is enforcement. The API decides; these decide what to render.
 */
function useGranted(): readonly Permission[] {
  const { user, isLoading } = useAuth();
  return isLoading ? [] : (user?.permissions ?? []);
}

/** Whether the current user holds a specific permission. */
export function useCan(permission: Permission): boolean {
  const granted = useGranted();

  return useMemo(() => granted.includes(permission), [granted, permission]);
}

/** Whether the current user holds ANY of the given permissions. */
export function useCanAny(permissions: Permission[]): boolean {
  const granted = useGranted();

  return useMemo(
    () => permissions.length > 0 && permissions.some((p) => granted.includes(p)),
    [granted, permissions],
  );
}

/** Whether the current user holds ALL of the given permissions. */
export function useCanAll(permissions: Permission[]): boolean {
  const granted = useGranted();

  return useMemo(
    () => permissions.length > 0 && permissions.every((p) => granted.includes(p)),
    [granted, permissions],
  );
}

/** Every permission the current user holds in the active organization. */
export function usePermissions(): readonly Permission[] {
  return useGranted();
}

/** The current user's role in the active organization. */
export function useOrgRole(): OrganizationUserRole | null {
  const { user, isLoading } = useAuth();
  return isLoading ? null : (user?.orgRole ?? null);
}

/**
 * The current user's platform standing, independent of any organization.
 *
 * For deciding what to render only — a platform surface is enforced by
 * `@SystemRoles` on the API, never by this.
 */
export function useSystemRole(): SystemRole | null {
  const { user, isLoading } = useAuth();
  return isLoading ? null : (user?.systemRole ?? null);
}
