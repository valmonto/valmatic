import {
  getPermissionsForRole,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  type Permission,
} from '@pkg/contracts';
import { useMemo } from 'react';
import { useAuthStore } from '@/shared/auth/auth-store';

/** Whether the current user has a specific permission (role-derived). */
export function useCan(permission: Permission): boolean {
  const role = useAuthStore((s) => s.user?.role);
  const loading = useAuthStore((s) => s.status === 'loading');
  return useMemo(() => (loading || !role ? false : hasPermission(role, permission)), [role, permission, loading]);
}

/** Whether the current user has ANY of the permissions. */
export function useCanAny(permissions: Permission[]): boolean {
  const role = useAuthStore((s) => s.user?.role);
  const loading = useAuthStore((s) => s.status === 'loading');
  return useMemo(
    () => (loading || !role || permissions.length === 0 ? false : hasAnyPermission(role, permissions)),
    [role, permissions, loading]
  );
}

/** Whether the current user has ALL of the permissions. */
export function useCanAll(permissions: Permission[]): boolean {
  const role = useAuthStore((s) => s.user?.role);
  const loading = useAuthStore((s) => s.status === 'loading');
  return useMemo(
    () => (loading || !role || permissions.length === 0 ? false : hasAllPermissions(role, permissions)),
    [role, permissions, loading]
  );
}

/** All permissions granted to the current user's role. */
export function usePermissions(): readonly Permission[] {
  const role = useAuthStore((s) => s.user?.role);
  const loading = useAuthStore((s) => s.status === 'loading');
  return useMemo(() => (loading || !role ? [] : getPermissionsForRole(role)), [role, loading]);
}

/** The current user's role (or null while loading / logged out). */
export function useRole() {
  const role = useAuthStore((s) => s.user?.role);
  const loading = useAuthStore((s) => s.status === 'loading');
  return loading ? null : (role ?? null);
}
