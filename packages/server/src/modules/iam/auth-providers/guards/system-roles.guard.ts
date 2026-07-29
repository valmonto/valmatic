import {
  Injectable,
  ForbiddenException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ActiveUser, SystemRole } from '@pkg/contracts';
import { k } from '@pkg/locales';
import { SYSTEM_ROLES_KEY } from '../decorators/system-roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public-route.decorator';

/**
 * Platform-role guard, the counterpart to `RolesGuard`.
 *
 * - `@PublicRoute()`     → skipped
 * - no `@SystemRoles()`  → skipped, since platform routes are the exception
 * - `@SystemRoles(...)`  → the caller's `systemRole` must be listed
 *
 * Reads `systemRole` straight off the request like every other guard in the
 * chain rather than querying the database, so authorization stays synchronous
 * and adds no per-request latency. The cost is that a revoked platform role
 * keeps working until the access token is refreshed — the same window that
 * already applies to `orgRole`, and the reason `verifyAccess` re-reads both.
 *
 * Matching is flat, with no hierarchy: `@SystemRoles(SystemRole.MODERATOR)`
 * does not admit an `ADMIN`. List every role that should pass.
 */
@Injectable()
export class SystemRolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<SystemRole[]>(SYSTEM_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Most routes are organization-scoped and say nothing about platform roles.
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{ user?: ActiveUser }>();

    if (!user?.systemRole) {
      throw new ForbiddenException(k.auth.errors.noRoleAssigned);
    }

    if (!requiredRoles.includes(user.systemRole)) {
      throw new ForbiddenException(k.auth.errors.insufficientPermissions);
    }

    return true;
  }
}
