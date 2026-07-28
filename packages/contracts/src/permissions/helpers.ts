import type { OrganizationUserRole } from '../schemas/organization.schema';
import type { Permission } from './list';
import { ROLE_PERMISSIONS } from './roles';


/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: OrganizationUserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Check if a role has ANY of the specified permissions.
 */
export function hasAnyPermission(role: OrganizationUserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => ROLE_PERMISSIONS[role].includes(p));
}

/**
 * Check if a role has ALL of the specified permissions.
 */
export function hasAllPermissions(role: OrganizationUserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => ROLE_PERMISSIONS[role].includes(p));
}

/**
 * Get all permissions for a specific role.
 */
export function getPermissionsForRole(role: OrganizationUserRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}
