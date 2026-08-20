/**
 * Organization-invitation value sets — the single source, used by the Zod
 * schemas in `schemas/invitation.schema.ts` and the varchar CHECK constraint
 * in `@pkg/database`. Zod-free so it ships to the browser without dragging the
 * schema graph in.
 */

/**
 * Lifecycle of an invitation.
 *
 *  - `pending`  — issued, not yet redeemed
 *  - `accepted` — redeemed once; the token is spent
 *  - `revoked`  — cancelled by an org admin before redemption
 *  - `expired`  — past `expiresAt` without redemption (resolved lazily on read,
 *                 so a stored `pending` row past its expiry still reads expired)
 */
export const INVITATION_STATUSES = ['pending', 'accepted', 'revoked', 'expired'] as const;

/** How long an invite link stays valid, in days. */
export const INVITATION_EXPIRY_DAYS = 7;
