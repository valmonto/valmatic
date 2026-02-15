import { SetMetadata } from '@nestjs/common';
import type { OrganizationUserRole } from '@pkg/contracts';

export const ROLES_KEY = 'roles';

/**
 * Role enum for explicit role references in decorators.
 *
 * @example
 * // Single role
 * @Roles(Role.OWNER)
 *
 * // Multiple roles - explicit, no hierarchy
 * @Roles(Role.OWNER, Role.ADMIN)
 *
 * // All roles
 * @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
 */
export const Role = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
} as const satisfies Record<string, OrganizationUserRole>;

/**
 * Decorator to restrict endpoint access to specific roles.
 *
 * STRICT MODE: Endpoints without @Roles() are denied by default.
 * Use @PublicRoute() for unauthenticated access.
 *
 * @example
 * @Roles(Role.OWNER)                         // Only OWNER
 * @Roles(Role.OWNER, Role.ADMIN)             // OWNER or ADMIN
 * @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER) // All authenticated users
 */
export const Roles = (...roles: OrganizationUserRole[]) => SetMetadata(ROLES_KEY, roles);
