import { z } from 'zod';
import { INVITATION_STATUSES } from '../constants/index.js';
import { PASSWORD_ERROR_MESSAGE, PASSWORD_REGEX } from '../constants/index.js';
import { EmptyRequestSchema } from './common.schema.js';
import { OrganizationUserRoleSchema } from './organization.schema.js';
import { AuthTokensSchema } from './auth.schema.js';

// --- Status enum ---
// Derived from ../constants — the same value set the database CHECK constraint
// enforces, defined exactly once.
export { INVITATION_STATUSES, INVITATION_EXPIRY_DAYS } from '../constants/index.js';
export const InvitationStatusSchema = z.enum(INVITATION_STATUSES);
export type InvitationStatus = z.infer<typeof InvitationStatusSchema>;

/**
 * A pending invitation as an org admin sees it in the list.
 *
 * DOMAIN-BLIND on purpose: the row carries only who (`email`), which
 * organization (implicit — it is org-scoped), and what standing (`orgRole`).
 * No project/feature/domain column ever rides here — the invitation is a pure
 * IAM primitive. The raw token is NEVER part of this view; it exists once, in
 * the create response, and only as a hash at rest.
 */
export const InvitationSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  orgRole: OrganizationUserRoleSchema,
  status: InvitationStatusSchema,
  expiresAt: z.string(),
  createdAt: z.string(),
});

export type Invitation = z.infer<typeof InvitationSchema>;

// --- Create ---
export const CreateInvitationRequestSchema = z
  .object({
    email: z.string().email(),
    orgRole: OrganizationUserRoleSchema,
  })
  .strict();

/**
 * `token` is the raw, unguessable secret — returned ONCE at creation and never
 * again (only its hash is stored). `acceptUrl` embeds it so the link can be
 * copied and handed over out-of-band (no email transport exists yet — see
 * GAPS.md). A future email adapter sends this same URL without any rework here.
 */
export const CreateInvitationResponseSchema = InvitationSchema.extend({
  token: z.string(),
  acceptUrl: z.string().url(),
});

export type CreateInvitationRequest = z.infer<typeof CreateInvitationRequestSchema>;
export type CreateInvitationResponse = z.infer<typeof CreateInvitationResponseSchema>;

// --- List (pending, active org) ---
export const ListInvitationsRequestSchema = EmptyRequestSchema;
export const ListInvitationsResponseSchema = z.object({ data: z.array(InvitationSchema) });

export type ListInvitationsRequest = z.infer<typeof ListInvitationsRequestSchema>;
export type ListInvitationsResponse = z.infer<typeof ListInvitationsResponseSchema>;

// --- Revoke ---
export const RevokeInvitationRequestSchema = z.object({ id: z.string().uuid() }).strict();
export const RevokeInvitationResponseSchema = z.object({});

export type RevokeInvitationRequest = z.infer<typeof RevokeInvitationRequestSchema>;
export type RevokeInvitationResponse = z.infer<typeof RevokeInvitationResponseSchema>;

// --- Preview (unauthenticated, token-gated) ---
// Token possession IS the credential, so this needs no session. It returns only
// what the recipient needs to decide — nothing sensitive: no org id, no
// inviter, no other members.
export const PreviewInvitationRequestSchema = z.object({ token: z.string().min(1) }).strict();
export const PreviewInvitationResponseSchema = z.object({
  orgName: z.string(),
  orgRole: OrganizationUserRoleSchema,
  email: z.string().email(),
  status: InvitationStatusSchema,
  /** True when no account exists yet for the invited email — the client shows
   *  the set-password flow rather than the "join as" confirm. */
  requiresSignup: z.boolean(),
});

export type PreviewInvitationRequest = z.infer<typeof PreviewInvitationRequestSchema>;
export type PreviewInvitationResponse = z.infer<typeof PreviewInvitationResponseSchema>;

// --- Accept: NEW user (no account) → set password + create account ---
// Public. Identity is NOT taken from this payload: the email is read from the
// invitation the token resolves to, never sent by the client. Only the new
// account's name and password come from here. Rejected if an account already
// exists for the invited email (that path uses `accept-existing` after login).
export const AcceptInvitationRequestSchema = z
  .object({
    token: z.string().min(1),
    name: z.string().min(1).max(255),
    password: z.string().regex(PASSWORD_REGEX, PASSWORD_ERROR_MESSAGE),
  })
  .strict();

export const AcceptInvitationResponseSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string(),
  }),
  orgId: z.string().uuid(),
  orgName: z.string(),
  // Delivered to non-cookie (mobile) clients; web receives httpOnly cookies.
  tokens: AuthTokensSchema.optional(),
});

export type AcceptInvitationRequest = z.infer<typeof AcceptInvitationRequestSchema>;
export type AcceptInvitationResponse = z.infer<typeof AcceptInvitationResponseSchema>;

// --- Accept: EXISTING account (authenticated) → add membership ---
// The session supplies identity; the token supplies the invitation. The server
// verifies the session email equals the invited email (email-bound: a forwarded
// link cannot let a different account in). No password step. Idempotent: an
// already-member consumes the invite without adding a duplicate row.
export const AcceptInvitationAsMemberRequestSchema = z
  .object({ token: z.string().min(1) })
  .strict();

export const AcceptInvitationAsMemberResponseSchema = z.object({
  orgId: z.string().uuid(),
  orgName: z.string(),
});

export type AcceptInvitationAsMemberRequest = z.infer<typeof AcceptInvitationAsMemberRequestSchema>;
export type AcceptInvitationAsMemberResponse = z.infer<
  typeof AcceptInvitationAsMemberResponseSchema
>;
