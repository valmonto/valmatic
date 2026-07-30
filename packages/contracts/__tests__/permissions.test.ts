import { describe, expect, it } from 'vitest';
import {
  getPermissionsForRole,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  ORGANIZATION_USER_ROLES,
} from '../src';
import { PERMISSIONS } from '../src/permissions/list';
import { ROLE_PERMISSIONS } from '../src/permissions/roles';

describe('the permission table', () => {
  // A permission no role holds is a feature silently dead for everyone —
  // routes can demand it, no user can ever pass. Four of these were found and
  // deleted by hand (org:delete, job:list/update/delete); this makes the next
  // one a CI failure instead of an archaeology find.
  it('grants every permission to at least one role', () => {
    const granted = new Set(Object.values(ROLE_PERMISSIONS).flat());
    const orphans = PERMISSIONS.filter((p) => !granted.has(p));

    expect(orphans).toEqual([]);
  });

  // A deliberate design constraint, not just a check: roles form a subset
  // chain, so "ADMIN can do something OWNER cannot" is impossible — the same
  // trap as @Roles(ADMIN) excluding OWNER, prevented at the data. If a
  // deliberately non-subset role is ever wanted, delete this test knowingly.
  it('keeps MEMBER ⊆ ADMIN ⊆ OWNER', () => {
    const admin = new Set<string>(ROLE_PERMISSIONS.ADMIN);
    const owner = new Set<string>(ROLE_PERMISSIONS.OWNER);

    expect(ROLE_PERMISSIONS.MEMBER.filter((p) => !admin.has(p))).toEqual([]);
    expect(ROLE_PERMISSIONS.ADMIN.filter((p) => !owner.has(p))).toEqual([]);
  });

  // A role without these cannot call /auth/me — the app bricks on boot for
  // every user holding it.
  it('gives every role the self-service core', () => {
    for (const role of ORGANIZATION_USER_ROLES) {
      expect(ROLE_PERMISSIONS[role]).toContain('auth:read-self');
      expect(ROLE_PERMISSIONS[role]).toContain('auth:change-password');
      expect(ROLE_PERMISSIONS[role]).toContain('auth:logout');
    }
  });

  it('lists each permission at most once per role', () => {
    for (const role of ORGANIZATION_USER_ROLES) {
      const list = ROLE_PERMISSIONS[role];
      expect(new Set(list).size).toBe(list.length);
    }
  });

  it('has a list for every role and no extras', () => {
    expect(Object.keys(ROLE_PERMISSIONS).sort()).toEqual([...ORGANIZATION_USER_ROLES].sort());
  });
});

describe('the helpers', () => {
  it('answers from the table', () => {
    expect(hasPermission('OWNER', 'user:create')).toBe(true);
    expect(hasPermission('MEMBER', 'user:create')).toBe(false);
    expect(hasAnyPermission('MEMBER', ['user:create', 'org:read'])).toBe(true);
    expect(hasAnyPermission('MEMBER', ['user:create', 'user:delete'])).toBe(false);
    expect(hasAllPermissions('OWNER', ['user:create', 'org:read'])).toBe(true);
    expect(hasAllPermissions('MEMBER', ['user:create', 'org:read'])).toBe(false);
    expect(getPermissionsForRole('OWNER')).toEqual(ROLE_PERMISSIONS.OWNER);
  });

  // A live JWT outlives the code that minted it: a renamed or removed role
  // reaches these helpers as a stale string for up to the access-token TTL.
  // That must degrade to "no permissions" (403), never to a crash inside the
  // guard (500 on every request until refresh).
  it('treats an unknown role as holding nothing, without throwing', () => {
    const stale = 'SUPERVISOR' as never;

    expect(hasPermission(stale, 'user:create')).toBe(false);
    expect(hasAnyPermission(stale, ['user:create'])).toBe(false);
    expect(hasAllPermissions(stale, ['user:create'])).toBe(false);
    expect(getPermissionsForRole(stale)).toEqual([]);
    expect(hasAllPermissions(stale, [])).toBe(true); // vacuous truth, same as before
  });
});
