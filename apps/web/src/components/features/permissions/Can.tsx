import type { ReactNode } from 'react';
import type { Permission } from '@pkg/contracts';
import { useCan, useCanAny, useCanAll } from '@/hooks/use-permissions';

type CanProps = {
  /** Single permission to check */
  permission?: Permission;
  /** Check if user has ANY of these permissions */
  any?: Permission[];
  /** Check if user has ALL of these permissions */
  all?: Permission[];
  /** Content to render if permission check passes */
  children: ReactNode;
  /** Content to render if permission check fails (defaults to null) */
  fallback?: ReactNode;
};

/**
 * Conditionally renders children based on user permissions.
 * Silently hides content when permission check fails.
 *
 * @example
 * // Single permission
 * <Can permission="user:create">
 *   <CreateUserButton />
 * </Can>
 *
 * @example
 * // Any of multiple permissions
 * <Can any={['user:update', 'user:delete']}>
 *   <UserActions />
 * </Can>
 *
 * @example
 * // All permissions required
 * <Can all={['org:update', 'org:delete']}>
 *   <OrgAdminPanel />
 * </Can>
 */
export function Can({ permission, any, all, children, fallback = null }: CanProps) {
  const canSingle = useCan(permission ?? ('org:list' as Permission));
  const canAny = useCanAny(any ?? []);
  const canAll = useCanAll(all ?? []);

  let allowed = false;
  if (permission) {
    allowed = canSingle;
  } else if (any && any.length > 0) {
    allowed = canAny;
  } else if (all && all.length > 0) {
    allowed = canAll;
  }

  return <>{allowed ? children : fallback}</>;
}
