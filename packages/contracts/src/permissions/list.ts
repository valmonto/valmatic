/**
 * All available permissions in the system.
 * Format: resource:action
 */
export const PERMISSIONS = [
  // Auth / self-service permissions (available to any authenticated user)
  'auth:read-self',
  'auth:change-password',
  'auth:logout',

  // Organization permissions
  'org:list',
  'org:read',
  'org:create',
  'org:update',
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

  // Notification permissions
  'notification:list',
  'notification:read',
  'notification:update',
  'notification:delete',

  // Settings permissions
  'settings:read',
  'settings:update',
] as const;

export type Permission = (typeof PERMISSIONS)[number];
