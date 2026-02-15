import { describe, it, expect } from 'vitest';
import { Reflector } from '@nestjs/core';
import { Roles, Role, ROLES_KEY } from '../../../../../src/modules/iam/auth-providers/decorators/roles.decorator';

describe('Roles', () => {
  const reflector = new Reflector();

  describe('Roles decorator', () => {
    it('should set single role metadata', () => {
      @Roles(Role.OWNER)
      class TestController {}

      const roles = reflector.get(ROLES_KEY, TestController);

      expect(roles).toEqual(['OWNER']);
    });

    it('should set multiple roles metadata', () => {
      @Roles(Role.OWNER, Role.ADMIN)
      class TestController {}

      const roles = reflector.get(ROLES_KEY, TestController);

      expect(roles).toEqual(['OWNER', 'ADMIN']);
    });

    it('should set all roles metadata', () => {
      @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
      class TestController {}

      const roles = reflector.get(ROLES_KEY, TestController);

      expect(roles).toEqual(['OWNER', 'ADMIN', 'MEMBER']);
    });

    it('should work on methods', () => {
      class TestController {
        @Roles(Role.ADMIN)
        adminOnly() {}
      }

      const roles = reflector.get(ROLES_KEY, TestController.prototype.adminOnly);

      expect(roles).toEqual(['ADMIN']);
    });

    it('should handle empty roles array', () => {
      @Roles()
      class TestController {}

      const roles = reflector.get(ROLES_KEY, TestController);

      expect(roles).toEqual([]);
    });

    it('should not affect other classes', () => {
      @Roles(Role.OWNER)
      class OwnerController {}

      class NoRolesController {}

      expect(reflector.get(ROLES_KEY, OwnerController)).toEqual(['OWNER']);
      expect(reflector.get(ROLES_KEY, NoRolesController)).toBeUndefined();
    });
  });

  describe('Role constant', () => {
    it('should have correct role values', () => {
      expect(Role.OWNER).toBe('OWNER');
      expect(Role.ADMIN).toBe('ADMIN');
      expect(Role.MEMBER).toBe('MEMBER');
    });

    it('should have all expected roles', () => {
      expect(Object.keys(Role)).toEqual(['OWNER', 'ADMIN', 'MEMBER']);
    });
  });
});
