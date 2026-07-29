import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { k } from '@pkg/locales';
import type { ActiveUser } from '@pkg/contracts';
import { IS_PUBLIC_KEY } from '../decorators/public-route.decorator';

/**
 * Keeps the organization in the URL honest.
 *
 * A route such as `/api/orgs/:orgId/users` states which organization it acts
 * on, but the path is client-supplied — nothing stops someone editing it. This
 * guard rejects the request unless that id matches the organization on the
 * verified token, so `:orgId` can never disagree with the session.
 *
 * It is inert on routes without an `:orgId` param, so adding it changes no
 * existing behaviour; routes opt in simply by naming the organization in their
 * path.
 *
 * Runs after `AuthGuard` (which populates `req.user`) and before `RolesGuard`
 * and `PermissionsGuard`, so those still read a role that belongs to the
 * organization actually being addressed.
 */
@Injectable()
export class ActiveOrgGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<{
      user?: ActiveUser;
      params?: Record<string, string>;
    }>();

    const sessionOrgId = request.user?.orgId;
    if (!sessionOrgId) {
      throw new ForbiddenException(k.orgs.errors.noActiveOrg);
    }

    const routeOrgId = request.params?.orgId;
    // No organization in the path — nothing to reconcile.
    if (!routeOrgId) return true;

    if (routeOrgId !== sessionOrgId) {
      throw new ForbiddenException(k.orgs.errors.orgMismatch);
    }

    return true;
  }
}
