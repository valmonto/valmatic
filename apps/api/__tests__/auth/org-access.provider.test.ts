import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrgAccessProvider } from '@/auth/org-access.provider';
import type { AuthRepository } from '@/auth/auth.repository';

/**
 * The app's contribution to the shared guard chain: `@pkg/server` owns the
 * guards, this answers the one question they cannot — whether a user belongs to
 * an organization, and as what.
 *
 * It returns `null` rather than throwing for "no access", because the caller is
 * a guard deciding a response code, not a handler reporting a failure.
 */
describe('OrgAccessProvider', () => {
  let provider: OrgAccessProvider;
  let findUserWithOrg: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    findUserWithOrg = vi.fn();
    provider = new OrgAccessProvider({ findUserWithOrg } as unknown as AuthRepository);
  });

  it('returns the role the user holds in that organization', async () => {
    findUserWithOrg.mockResolvedValue({
      id: 'u1',
      email: 'a@example.com',
      name: 'A',
      displayName: null,
      role: 'ADMIN',
      orgId: 'org-1',
    });

    await expect(provider.verifyAccess({ userId: 'u1', orgId: 'org-1' })).resolves.toEqual({
      role: 'ADMIN',
    });
  });

  it('returns null when the user is not a member', async () => {
    findUserWithOrg.mockResolvedValue(null);

    await expect(provider.verifyAccess({ userId: 'u1', orgId: 'other-org' })).resolves.toBeNull();
  });

  it('scopes the lookup to both the user and the organization', async () => {
    findUserWithOrg.mockResolvedValue(null);

    await provider.verifyAccess({ userId: 'u1', orgId: 'org-9' });

    // Looking up by user alone would return a membership of some other org.
    expect(findUserWithOrg).toHaveBeenCalledWith('u1', 'org-9');
  });

  it('exposes only the role, not the rest of the user record', async () => {
    findUserWithOrg.mockResolvedValue({
      id: 'u1',
      email: 'a@example.com',
      name: 'A',
      displayName: null,
      role: 'MEMBER',
      orgId: 'org-1',
    });

    const access = await provider.verifyAccess({ userId: 'u1', orgId: 'org-1' });

    expect(Object.keys(access!)).toEqual(['role']);
  });
});
