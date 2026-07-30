import { ForbiddenException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import type { ActiveUser } from '@pkg/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SystemRolesGuard } from '../../../../../src/modules/iam/auth-providers/guards/system-roles.guard';
import { SYSTEM_ROLES_KEY } from '../../../../../src/modules/iam/auth-providers/decorators/system-roles.decorator';
import { IS_PUBLIC_KEY } from '../../../../../src/modules/iam/auth-providers/decorators/public-route.decorator';

function contextFor(user?: Partial<ActiveUser>): ExecutionContext {
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

/**
 * Answers by metadata key rather than call order, so adding a lookup to the
 * guard cannot silently shift what these tests are asserting.
 */
function reflectorWith(values: Record<string, unknown>): Reflector {
  return {
    getAllAndOverride: vi.fn((key: unknown) => values[key as string]),
  } as unknown as Reflector;
}

const admin: ActiveUser = {
  userId: '11111111-1111-4111-8111-111111111111',
  orgId: '22222222-2222-4222-8222-222222222222',
  orgRole: 'MEMBER',
  systemRole: 'ADMIN',
};

describe('SystemRolesGuard', () => {
  let guard: SystemRolesGuard;

  beforeEach(() => {
    guard = new SystemRolesGuard(reflectorWith({}));
  });

  it('ignores a route that declares no system roles', () => {
    expect(guard.canActivate(contextFor(admin))).toBe(true);
  });

  it('skips a public route', () => {
    const g = new SystemRolesGuard(
      reflectorWith({ [IS_PUBLIC_KEY]: true, [SYSTEM_ROLES_KEY]: ['ADMIN'] }),
    );

    expect(g.canActivate(contextFor(undefined))).toBe(true);
  });

  it('admits a caller holding the required system role', () => {
    const g = new SystemRolesGuard(reflectorWith({ [SYSTEM_ROLES_KEY]: ['ADMIN'] }));

    expect(g.canActivate(contextFor(admin))).toBe(true);
  });

  it('refuses a caller without it', () => {
    const g = new SystemRolesGuard(reflectorWith({ [SYSTEM_ROLES_KEY]: ['ADMIN'] }));

    expect(() => g.canActivate(contextFor({ ...admin, systemRole: 'USER' }))).toThrow(
      ForbiddenException,
    );
  });

  /**
   * The whole reason the two axes are named apart: both enums contain ADMIN, so
   * a guard reading the wrong field would let an organization ADMIN through a
   * platform route.
   */
  it('does not accept an organization ADMIN as a platform ADMIN', () => {
    const g = new SystemRolesGuard(reflectorWith({ [SYSTEM_ROLES_KEY]: ['ADMIN'] }));

    expect(() =>
      g.canActivate(contextFor({ ...admin, orgRole: 'ADMIN', systemRole: 'USER' })),
    ).toThrow(ForbiddenException);
  });

  // Flat matching, as documented — listing MODERATOR does not imply ADMIN.
  it('does not treat ADMIN as satisfying a MODERATOR requirement', () => {
    const g = new SystemRolesGuard(reflectorWith({ [SYSTEM_ROLES_KEY]: ['MODERATOR'] }));

    expect(() => g.canActivate(contextFor(admin))).toThrow(ForbiddenException);
  });

  it('admits when any listed role matches', () => {
    const g = new SystemRolesGuard(reflectorWith({ [SYSTEM_ROLES_KEY]: ['MODERATOR', 'ADMIN'] }));

    expect(g.canActivate(contextFor(admin))).toBe(true);
  });

  it('refuses a request carrying no user at all', () => {
    const g = new SystemRolesGuard(reflectorWith({ [SYSTEM_ROLES_KEY]: ['ADMIN'] }));

    expect(() => g.canActivate(contextFor(undefined))).toThrow(ForbiddenException);
  });
});
