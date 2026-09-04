import z from 'zod';
import { ORGANIZATION_USER_ROLES, SYSTEM_ROLES } from '../constants/index.js';

/**
 * Who the caller is, for the length of one request.
 *
 * Two independent axes of authority, named apart on purpose: both enums contain
 * `ADMIN`, so a single field called `role` cannot say which one it means.
 *
 *  - `orgRole`    — what they may do inside the active organization. Drives
 *                   `ROLE_PERMISSIONS`, `@Roles` and `@Permissions`.
 *  - `systemRole` — platform standing, independent of any organization. Drives
 *                   `@SystemRoles`, and nothing else. It never widens an
 *                   organization-scoped route; it opens separate ones.
 *
 * Both ride in the access token and are re-read from the database on every
 * refresh, so revoking either takes effect within the access-token TTL rather
 * than lasting the full session.
 */
export const ActiveUserSchema = z.object({
  orgId: z.string().uuid(),
  userId: z.string().uuid(),
  orgRole: z.enum(ORGANIZATION_USER_ROLES),
  systemRole: z.enum(SYSTEM_ROLES),
});

export type ActiveUser = z.infer<typeof ActiveUserSchema>;

export const IamIssueTokensRequestSchema = ActiveUserSchema;

export const IamIssueTokensResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const IamVerifyTokenRequestSchema = z.object({
  token: z.string(),
});

export const IamVerifyTokenResponseSchema = z.object({
  userId: z.string(),
});

export const IamRevokeTokenRequestSchema = z.object({
  token: z.string(),
});

export const IamRevokeTokenResponseSchema = z.object({
  userId: z.string(),
});

export const IamRefreshTokenRequestSchema = z.object({
  refreshToken: z.string(),
});

export const IamRefreshTokenResponseSchema = IamIssueTokensResponseSchema;

export type IamIssueTokensRequest = z.infer<typeof IamIssueTokensRequestSchema>;
export type IamIssueTokensResponse = z.infer<typeof IamIssueTokensResponseSchema>;

export type IamVerifyTokenRequest = z.infer<typeof IamVerifyTokenRequestSchema>;
export type IamVerifyTokenResponse = z.infer<typeof IamVerifyTokenResponseSchema>;

export type IamRevokeTokenRequest = z.infer<typeof IamRevokeTokenRequestSchema>;
export type IamRevokeTokenResponse = z.infer<typeof IamRevokeTokenResponseSchema>;

export type IamRefreshTokenRequest = z.infer<typeof IamRefreshTokenRequestSchema>;
export type IamRefreshTokenResponse = z.infer<typeof IamRefreshTokenResponseSchema>;
