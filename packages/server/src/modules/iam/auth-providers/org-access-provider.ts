import type { OrganizationUserRole, SystemRole } from '@pkg/contracts';

export const ORG_ACCESS = Symbol('ORG_ACCESS');

/**
 * Resolves the caller's current standing on both axes of authority, from the
 * database rather than the session.
 *
 * Called on every token refresh, which is what stops a revoked role from
 * outliving the access-token TTL. Returning null means the user no longer
 * belongs to the organization at all, and the session is destroyed.
 */
export interface IOrgAccessProvider {
  verifyAccess(opts: {
    userId: string;
    orgId: string;
  }): Promise<{ orgRole: OrganizationUserRole; systemRole: SystemRole } | null>;
}
