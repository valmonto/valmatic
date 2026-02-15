import { useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import type { Permission } from '@pkg/contracts';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getPermissionsForRole,
} from '@pkg/contracts';

/**
 * Check if current user has a specific permission.
 */
export function useCan(permission: Permission): boolean {
  const { user, isLoading } = useAuth();

  return useMemo(() => {
    if (isLoading || !user?.role) return false;
    return hasPermission(user.role, permission);
  }, [user?.role, permission, isLoading]);
}

/**
 * Check if current user has ANY of the specified permissions.
 */
export function useCanAny(permissions: Permission[]): boolean {
  const { user, isLoading } = useAuth();

  return useMemo(() => {
    if (isLoading || !user?.role || permissions.length === 0) return false;
    return hasAnyPermission(user.role, permissions);
  }, [user?.role, permissions, isLoading]);
}

/**
 * Check if current user has ALL of the specified permissions.
 */
export function useCanAll(permissions: Permission[]): boolean {
  const { user, isLoading } = useAuth();

  return useMemo(() => {
    if (isLoading || !user?.role || permissions.length === 0) return false;
    return hasAllPermissions(user.role, permissions);
  }, [user?.role, permissions, isLoading]);
}

/**
 * Get all permissions for the current user.
 */
export function usePermissions(): readonly Permission[] {
  const { user, isLoading } = useAuth();

  return useMemo(() => {
    if (isLoading || !user?.role) return [];
    return getPermissionsForRole(user.role);
  }, [user?.role, isLoading]);
}

/**
 * Get the current user's role.
 */
export function useRole() {
  const { user, isLoading } = useAuth();
  return isLoading ? null : user?.role ?? null;
}
