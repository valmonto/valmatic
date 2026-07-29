import { type Permission } from '@pkg/contracts';
import { usePermissions } from '@/shared/hooks/use-permissions';
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
 * Declarative permission gate — renders `children` only if the current user
 * holds the requested permission(s), else `fallback`.
 *
 * Reads the permissions the API resolved and sent, so it never needs a copy of
 * the permission table.
 *
 * `<Can permission="user:create"><Button …/></Can>`
 * `<Can anyOf={['org:update','org:delete']}>…</Can>`
 */
export function Can({ permission, anyOf, allOf, fallback = null, children }: CanProps) {
  const granted = usePermissions();

  const allowed = React.useMemo(() => {
    if (allOf) return allOf.length > 0 && allOf.every((p) => granted.includes(p));
    if (anyOf) return anyOf.length > 0 && anyOf.some((p) => granted.includes(p));
    if (permission) return granted.includes(permission);
    return false;
  }, [granted, permission, anyOf, allOf]);

  return <>{allowed ? children : fallback}</>;
}
