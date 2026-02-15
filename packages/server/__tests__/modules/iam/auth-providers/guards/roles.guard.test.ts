import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../../../../src/modules/iam/auth-providers/guards/roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let mockReflector: Reflector;

  beforeEach(() => {
    mockReflector = {
      getAllAndOverride: vi.fn(),
    } as unknown as Reflector;

    guard = new RolesGuard(mockReflector);
  });

  const createMockContext = (user?: { role?: string }): ExecutionContext =>
    ({
      getHandler: () => () => {},
      getClass: () => class {},
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  describe('canActivate', () => {
    it('should allow access for public routes', () => {
      const context = createMockContext();
      vi.mocked(mockReflector.getAllAndOverride).mockReturnValueOnce(true);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny access when no @Roles decorator is present', () => {
      const context = createMockContext({ role: 'admin' });
      vi.mocked(mockReflector.getAllAndOverride)
        .mockReturnValueOnce(false) // isPublic
        .mockReturnValueOnce(undefined); // requiredRoles

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should throw correct message when no @Roles decorator', () => {
      const context = createMockContext({ role: 'admin' });
      vi.mocked(mockReflector.getAllAndOverride)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(undefined);

      expect(() => guard.canActivate(context)).toThrow('auth.errors.roleAuthorizationRequired');
    });

    it('should deny access when user has no role', () => {
      const context = createMockContext({ role: undefined });
      vi.mocked(mockReflector.getAllAndOverride)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(['admin']);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should throw correct message when user has no role', () => {
      const context = createMockContext({ role: undefined });
      vi.mocked(mockReflector.getAllAndOverride)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(['admin']);

      expect(() => guard.canActivate(context)).toThrow('auth.errors.noRoleAssigned');
    });

    it('should deny access when user role is not in required roles', () => {
      const context = createMockContext({ role: 'member' });
      vi.mocked(mockReflector.getAllAndOverride)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(['admin', 'owner']);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should throw correct message for insufficient permissions', () => {
      const context = createMockContext({ role: 'member' });
      vi.mocked(mockReflector.getAllAndOverride)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(['admin', 'owner']);

      expect(() => guard.canActivate(context)).toThrow('auth.errors.insufficientPermissions');
    });

    it('should allow access when user role matches required roles', () => {
      const context = createMockContext({ role: 'admin' });
      vi.mocked(mockReflector.getAllAndOverride)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(['admin', 'owner']);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access with single required role', () => {
      const context = createMockContext({ role: 'owner' });
      vi.mocked(mockReflector.getAllAndOverride)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(['owner']);

      expect(guard.canActivate(context)).toBe(true);
    });
  });
});
