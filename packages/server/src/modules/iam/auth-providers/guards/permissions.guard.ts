import {
  Injectable,
  ForbiddenException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { hasAnyPermission, hasAllPermissions } from '@pkg/contracts';
import { k } from '@pkg/locales';
import {
  PERMISSIONS_KEY,
  type PermissionsMetadata,
} from '../decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public-route.decorator';

/**
 * Permission-based Access Control Guard
 *
 * - @PublicRoute() → Skip permission check
 * - @Permissions('perm1', 'perm2') → User needs ANY of the listed permissions
 * - @Permissions({ permissions: [...], mode: 'all' }) → User needs ALL permissions
 * - No @Permissions() decorator → Skip permission check (rely on @Roles or other guards)
 *
 * This guard runs AFTER AuthGuard and RolesGuard, so req.user is populated with role.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if route is public - skip permission check entirely
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Get required permissions from decorator
    const metadata = this.reflector.getAllAndOverride<PermissionsMetadata>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Permissions() decorator = skip this guard (permissions are optional)
    // This allows using @Roles() without @Permissions() for simpler cases
    if (!metadata || metadata.permissions.length === 0) {
      return true;
    }

    // Get user from request (set by AuthGuard)
    const { user } = context.switchToHttp().getRequest();

    if (!user?.role) {
      throw new ForbiddenException(k.auth.errors.noRoleAssigned);
    }

    // Check permissions based on mode
    const hasPermission =
      metadata.mode === 'all'
        ? hasAllPermissions(user.role, metadata.permissions)
        : hasAnyPermission(user.role, metadata.permissions);

    if (!hasPermission) {
      throw new ForbiddenException(k.auth.errors.insufficientPermissions);
    }

    return true;
  }
}
