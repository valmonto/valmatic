import type { OrganizationUserRole } from './schemas/organization.schema';

/**
 * All available permissions in the system.
 * Format: resource:action
 */
export const PERMISSIONS = [
  // Organization permissions
  'org:list',
  'org:read',
  'org:create',
  'org:update',
  'org:delete',
  'org:switch',

  // User management permissions
  'user:list',
  'user:read',
  'user:create',
  'user:update',
  'user:delete',
  'user:create-owner', // Special: create users with OWNER role
  'user:promote-owner', // Special: promote existing users to OWNER
  'user:remove-owner', // Special: remove users with OWNER role

  // Job permissions
  'job:list',
  'job:create',
  'job:update',
  'job:delete',

  // Settings permissions
  'settings:read',
  'settings:update',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/**
 * Role to permissions mapping.
 * Each role has an explicit list of permissions - no inheritance.
 */
export const ROLE_PERMISSIONS: Record<OrganizationUserRole, readonly Permission[]> = {
  OWNER: [
    'org:list',
    'org:read',
    'org:create',
    'org:update',
    'org:delete',
    'org:switch',
    'user:list',
    'user:read',
    'user:create',
    'user:update',
    'user:delete',
    'user:create-owner',
    'user:promote-owner',
    'user:remove-owner',
    'job:list',
    'job:create',
    'job:update',
    'job:delete',
    'settings:read',
    'settings:update',
  ],
  ADMIN: [
    'org:list',
    'org:read',
    'org:create',
    'org:switch',
    'user:list',
    'user:read',
    'user:create',
    'user:update',
    'user:delete',
    'job:list',
    'job:create',
    'job:update',
    'job:delete',
    'settings:read',
    'settings:update',
  ],
  MEMBER: [
    'org:list',
    'org:read',
    'org:create',
    'org:switch',
    'job:list',
    'settings:read',
  ],
} as const;

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
