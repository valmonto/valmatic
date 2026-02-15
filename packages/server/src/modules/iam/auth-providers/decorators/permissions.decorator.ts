import { SetMetadata } from '@nestjs/common';
import type { Permission } from '@pkg/contracts';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Mode for permission checking:
 * - 'any': User must have at least one of the specified permissions (OR)
 * - 'all': User must have all of the specified permissions (AND)
 */
export type PermissionMode = 'any' | 'all';

export interface PermissionsMetadata {
  permissions: Permission[];
  mode: PermissionMode;
}

/**
 * Decorator to restrict endpoint access based on permissions.
 *
 * Use this for fine-grained access control beyond role-based checks.
 * Can be combined with @Roles() - both checks must pass.
 *
 * @example
 * // Single permission
 * @Permissions('user:create')
 *
 * // Multiple permissions (ANY - user needs at least one)
 * @Permissions('user:update', 'user:delete')
 *
 * // Multiple permissions (ALL - user needs all of them)
 * @Permissions({ permissions: ['settings:read', 'settings:update'], mode: 'all' })
 */
export function Permissions(
  ...args: Permission[] | [{ permissions: Permission[]; mode: PermissionMode }]
): MethodDecorator & ClassDecorator {
  // Check if first argument is a config object
  if (args.length === 1 && typeof args[0] === 'object' && 'permissions' in args[0]) {
    const config = args[0] as { permissions: Permission[]; mode: PermissionMode };
    return SetMetadata<string, PermissionsMetadata>(PERMISSIONS_KEY, {
      permissions: config.permissions,
      mode: config.mode,
    });
  }

  // Default: list of permissions with 'any' mode
  return SetMetadata<string, PermissionsMetadata>(PERMISSIONS_KEY, {
    permissions: args as Permission[],
    mode: 'any',
  });
}
