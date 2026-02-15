import { Injectable, ForbiddenException, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { OrganizationUserRole } from '@pkg/contracts';
import { k } from '@pkg/locales';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public-route.decorator';

/**
 * STRICT RBAC Guard
 *
 * - @PublicRoute() → Skip role check (unauthenticated access allowed)
 * - @Roles(Role.X, Role.Y) → Only listed roles allowed
 * - No decorator → DENIED (strict mode)
 *
 * This guard runs AFTER AuthGuard, so req.user is already populated.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if route is public - skip role check entirely
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Get required roles from decorator
    const requiredRoles = this.reflector.getAllAndOverride<OrganizationUserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // STRICT MODE: No @Roles() decorator = denied
    if (!requiredRoles || requiredRoles.length === 0) {
      throw new ForbiddenException(k.auth.errors.roleAuthorizationRequired);
    }

    // Get user from request (set by AuthGuard)
    const { user } = context.switchToHttp().getRequest();

    if (!user?.role) {
      throw new ForbiddenException(k.auth.errors.noRoleAssigned);
    }

    // Check if user's role is in the allowed list (explicit, no hierarchy)
    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(k.auth.errors.insufficientPermissions);
    }

    return true;
  }
}
