import type { OrganizationUserRole } from '../schemas/organization.schema.js';
import type { Permission } from './list.js';
import { ROLE_PERMISSIONS } from './roles.js';

/**
 * Check if a role has a specific permission.
 *
 * An unknown role resolves to NO permissions rather than throwing: a live JWT
 * outlives the code that minted it, so a renamed or removed role arrives here
 * as a stale string for up to the access-token TTL. That must be a 403, never
 * an undefined.includes crash inside a guard turning every request into a 500.
 */
export function hasPermission(role: OrganizationUserRole, permission: Permission): boolean {
  return (ROLE_PERMISSIONS[role] ?? []).includes(permission);
}

/**
 * Check if a role has ANY of the specified permissions.
 */
export function hasAnyPermission(role: OrganizationUserRole, permissions: Permission[]): boolean {
  const granted = ROLE_PERMISSIONS[role] ?? [];
  return permissions.some((p) => granted.includes(p));
}

/**
 * Check if a role has ALL of the specified permissions.
 */
export function hasAllPermissions(role: OrganizationUserRole, permissions: Permission[]): boolean {
  const granted = ROLE_PERMISSIONS[role] ?? [];
  return permissions.every((p) => granted.includes(p));
}

/**
 * Get all permissions for a specific role.
 */
export function getPermissionsForRole(role: OrganizationUserRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
