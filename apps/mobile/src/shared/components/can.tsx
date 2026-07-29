import { type Permission } from '@pkg/contracts';
import { usePermissions } from '@/shared/hooks/use-permissions';
import * as React from 'react';

type CanProps = {
  /** Single permission. */
  permission?: Permission;
  /** Passes if the user has ANY of these. */
  any?: Permission[];
  /** Passes if the user has ALL of these. */
  all?: Permission[];
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
 * `<Can any={['org:update','org:delete']}>…</Can>`
 */
export function Can({ permission, any, all, fallback = null, children }: CanProps) {
  const granted = usePermissions();

  const allowed = React.useMemo(() => {
    if (all) return all.length > 0 && all.every((p) => granted.includes(p));
    if (any) return any.length > 0 && any.some((p) => granted.includes(p));
    if (permission) return granted.includes(permission);
    return false;
  }, [granted, permission, any, all]);

  return <>{allowed ? children : fallback}</>;
}
