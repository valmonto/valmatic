import { describe, it, expect } from 'vitest';
import type { ActiveUser } from '@pkg/contracts';
import { extractActiveUser } from '../../../../../src/modules/iam/auth-providers/decorators/active-user.decorator';

describe('extractActiveUser', () => {
  const mockUser: ActiveUser = {
    userId: 'user-123',
    orgId: 'org-456',
    orgRole: 'ADMIN',
    systemRole: 'USER',
  };

  describe('with full user object', () => {
    it('should return full user when no field specified', () => {
      const result = extractActiveUser(mockUser);

      expect(result).toEqual(mockUser);
    });

    it('should return full user when field is undefined', () => {
      const result = extractActiveUser(mockUser, undefined);

      expect(result).toEqual(mockUser);
    });
  });

  describe('with specific field', () => {
    it('should return userId when field is "userId"', () => {
      const result = extractActiveUser(mockUser, 'userId');

      expect(result).toBe('user-123');
    });

    it('should return orgId when field is "orgId"', () => {
      const result = extractActiveUser(mockUser, 'orgId');

      expect(result).toBe('org-456');
    });

    it('should return the organization role when field is "orgRole"', () => {
      const result = extractActiveUser(mockUser, 'orgRole');

      expect(result).toBe('ADMIN');
    });

    // Both enums contain ADMIN, so a decorator asking for one axis must never
    // hand back the other.
    it('should return the system role when field is "systemRole"', () => {
      const result = extractActiveUser(mockUser, 'systemRole');

      expect(result).toBe('USER');
    });
  });

  describe('with undefined user', () => {
    it('should return undefined when user is undefined', () => {
      const result = extractActiveUser(undefined);

      expect(result).toBeUndefined();
    });

    it('should return undefined when user is undefined even with field', () => {
      const result = extractActiveUser(undefined, 'userId');

      expect(result).toBeUndefined();
    });
  });
});
