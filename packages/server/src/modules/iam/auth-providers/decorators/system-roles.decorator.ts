import { SetMetadata } from '@nestjs/common';
import type { SystemRole as SystemRoleType } from '@pkg/contracts';

export const SYSTEM_ROLES_KEY = 'systemRoles';

/**
 * Platform-level roles, held on the user account rather than a membership.
 *
 * Deliberately a separate constant from `Role` in `roles.decorator.ts`: both
 * contain `ADMIN`, and `@SystemRoles(SystemRole.ADMIN)` must not be mistakable
 * for `@Roles(Role.ADMIN)` when read at a call site.
 */
export const SystemRole = {
  USER: 'USER',
  MODERATOR: 'MODERATOR',
  ADMIN: 'ADMIN',
} as const satisfies Record<string, SystemRoleType>;

/**
 * Restricts an endpoint to platform roles, independent of any organization.
 *
 * This grants access to routes that exist *outside* tenancy — a support console,
 * a platform dashboard. It deliberately does not widen an organization-scoped
 * route: every tenant route stays scoped to the caller's active organization
 * whatever their system role, so there is one code path to reason about rather
 * than two.
 *
 * Satisfies the strict default-deny in `RolesGuard` on its own, so a platform
 * route needs no companion `@Roles` or `@Permissions`.
 *
 * @example
 * @SystemRoles(SystemRole.ADMIN)                      // platform admins only
 * @SystemRoles(SystemRole.ADMIN, SystemRole.MODERATOR)
 */
export const SystemRoles = (...roles: SystemRoleType[]): ReturnType<typeof SetMetadata> =>
  SetMetadata(SYSTEM_ROLES_KEY, roles);
