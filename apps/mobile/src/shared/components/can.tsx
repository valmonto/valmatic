import { hasAllPermissions, hasAnyPermission, hasPermission, type Permission } from '@pkg/contracts';
import { useAuthStore } from '@/shared/auth/auth-store';
import * as React from 'react';

type CanProps = {
  /** Single permission. */
  permission?: Permission;
  /** Passes if the user has ANY of these. */
  anyOf?: Permission[];
  /** Passes if the user has ALL of these. */
  allOf?: Permission[];
  /** Rendered when the check fails (default: nothing). */
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

/**
 * Declarative permission gate — renders `children` only if the current user's
 * role grants the requested permission(s), else `fallback`.
 *
 * `<Can permission="user:create"><Button …/></Can>`
 * `<Can anyOf={['org:update','org:delete']}>…</Can>`
 */
export function Can({ permission, anyOf, allOf, fallback = null, children }: CanProps) {
  const role = useAuthStore((s) => s.user?.role);
  const loading = useAuthStore((s) => s.status === 'loading');

  const allowed = React.useMemo(() => {
    if (loading || !role) return false;
    if (allOf) return hasAllPermissions(role, allOf);
    if (anyOf) return hasAnyPermission(role, anyOf);
    if (permission) return hasPermission(role, permission);
    return false;
  }, [role, loading, permission, anyOf, allOf]);

  return <>{allowed ? children : fallback}</>;
}
