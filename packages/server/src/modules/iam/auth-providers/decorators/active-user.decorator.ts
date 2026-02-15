import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { ActiveUser as ActiveUserType } from '@pkg/contracts';

/**
 * Extracts active user data from request.
 * If a field is specified, returns that field; otherwise returns the full user object.
 */
export function extractActiveUser(
  user: ActiveUserType | undefined,
  field?: keyof ActiveUserType,
): ActiveUserType | ActiveUserType[keyof ActiveUserType] | undefined {
  if (!user) return undefined;
  return field ? user[field] : user;
}

export const ActiveUser = createParamDecorator(
  (data: keyof ActiveUserType | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: ActiveUserType = request.user;
    return extractActiveUser(user, data);
  },
);
