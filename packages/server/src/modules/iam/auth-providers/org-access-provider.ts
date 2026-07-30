import type { ActiveUser } from '@pkg/contracts';

export const ORG_ACCESS = Symbol('ORG_ACCESS');

/**
 * The caller's current standing on both axes of authority.
 *
 * Derived from ActiveUser rather than declared on its own, because these values
 * are written straight back into the session — the shapes must never drift.
 */
export type VerifiedAccess = Pick<ActiveUser, 'orgRole' | 'systemRole'>;

/**
 * Resolves the caller's current standing from the database rather than the
 * session.
 *
 * Called on every token refresh, which is what stops a revoked role from
 * outliving the access-token TTL. Returning null means the user no longer
 * belongs to the organization at all, and the session is destroyed.
 */
export interface IOrgAccessProvider {
  verifyAccess(opts: { userId: string; orgId: string }): Promise<VerifiedAccess | null>;
}
