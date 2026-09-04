import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { PermissionsGuard } from '../../../../../src/modules/iam/auth-providers/guards/permissions.guard.js';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let mockReflector: Reflector;

  beforeEach(() => {
    mockReflector = {
      getAllAndOverride: vi.fn(),
    } as unknown as Reflector;

    guard = new PermissionsGuard(mockReflector);
  });

  const createMockContext = (user?: { orgRole?: string; systemRole?: string }): ExecutionContext =>
    ({
      getHandler: () => () => {},
      getClass: () => class {},
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  /** First reflector read is IS_PUBLIC_KEY, second is PERMISSIONS_KEY. */
  const arrange = (
    isPublic: boolean,
    metadata?: { permissions: string[]; mode?: 'any' | 'all' },
  ) => {
    vi.mocked(mockReflector.getAllAndOverride)
      .mockReturnValueOnce(isPublic)
      .mockReturnValueOnce(metadata);
  };

  it('allows public routes without looking at the user', () => {
    arrange(true);

    expect(guard.canActivate(createMockContext(undefined))).toBe(true);
  });

  it('allows a route with no @Permissions — that route is authorized by @Roles or another guard', () => {
    arrange(false, undefined);

    expect(guard.canActivate(createMockContext({ orgRole: 'MEMBER' }))).toBe(true);
  });

  it('treats an empty permission list like no decorator', () => {
    arrange(false, { permissions: [] });

    expect(guard.canActivate(createMockContext({ orgRole: 'MEMBER' }))).toBe(true);
  });

  it('denies when the request carries no org role', () => {
    arrange(false, { permissions: ['user:list'] });

    expect(() => guard.canActivate(createMockContext({ orgRole: undefined }))).toThrow(
      'auth.errors.noRoleAssigned',
    );
  });

  it('allows an OWNER on a permission owners hold', () => {
    arrange(false, { permissions: ['user:list'] });

    expect(guard.canActivate(createMockContext({ orgRole: 'OWNER' }))).toBe(true);
  });

  it('denies a MEMBER on a permission members lack, with the translated message', () => {
    arrange(false, { permissions: ['user:list'] });

    let thrown: unknown;
    try {
      guard.canActivate(createMockContext({ orgRole: 'MEMBER' }));
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(ForbiddenException);
    expect((thrown as Error).message).toBe('auth.errors.insufficientPermissions');
  });

  it('mode "any" passes when at least one listed permission is held', () => {
    arrange(false, { permissions: ['user:list', 'org:delete-nonexistent'], mode: 'any' });

    expect(guard.canActivate(createMockContext({ orgRole: 'ADMIN' }))).toBe(true);
  });

  it('mode "all" fails when any listed permission is missing', () => {
    arrange(false, { permissions: ['user:list', 'org:delete-nonexistent'], mode: 'all' });

    expect(() => guard.canActivate(createMockContext({ orgRole: 'ADMIN' }))).toThrow(
      ForbiddenException,
    );
  });

  /**
   * The two role axes must never be conflated: a platform ADMIN with a MEMBER
   * membership has member permissions in the org. ROLE_PERMISSIONS is keyed
   * on orgRole alone.
   */
  it('ignores systemRole entirely — a platform ADMIN who is an org MEMBER is still a MEMBER here', () => {
    arrange(false, { permissions: ['user:list'] });

    expect(() =>
      guard.canActivate(createMockContext({ orgRole: 'MEMBER', systemRole: 'ADMIN' })),
    ).toThrow(ForbiddenException);
  });
});
