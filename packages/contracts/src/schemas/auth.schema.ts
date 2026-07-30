import { z } from 'zod';
import { EmptyRequestSchema } from './common.schema';
import { PermissionSchema } from './permission.schema';
import { PASSWORD_ERROR_MESSAGE, PASSWORD_REGEX } from '../constants';
import { OrganizationUserRoleSchema } from './organization.schema';
import { SystemRoleSchema } from './user.schema';
import { FEATURE_FLAGS } from '../constants';

// Defined in constants.ts (Zod-free) so the frontend can import them without
// pulling in the schema graph; re-exported here for existing callers.
export { PASSWORD_ERROR_MESSAGE, PASSWORD_REGEX } from '../constants';

/**
 * Bearer tokens returned to non-cookie clients (e.g. the mobile app),
 * identified by the `X-Client: mobile` request header. Web clients receive
 * these as httpOnly cookies instead and never see this field.
 */
export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const LoginResponseSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string(),
  }),
  tokens: AuthTokensSchema.optional(),
});

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().regex(PASSWORD_REGEX, PASSWORD_ERROR_MESSAGE),
  name: z.string().min(1).max(255),
  organizationName: z.string().min(1).max(255),
});

export const RegisterResponseSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string(),
  }),
  tokens: AuthTokensSchema.optional(),
});

/**
 * Refresh endpoint for non-cookie clients. Mobile sends its stored refresh
 * token in the body; web clients may omit it and rely on the refresh cookie.
 */
export const RefreshRequestSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});
export const RefreshResponseSchema = z.object({
  tokens: AuthTokensSchema.optional(),
});

export const LogoutRequestSchema = z.object({
  // Mobile clients pass their stored refresh token so it can be revoked
  // server-side; web clients rely on the refresh cookie instead.
  refreshToken: z.string().optional(),
});
export const LogoutResponseSchema = z.object({});

/** `GET /auth/me` takes no input — the session identifies the user. */
const FeatureFlagSchema = z.enum(FEATURE_FLAGS);

export const CurrentUserRequestSchema = EmptyRequestSchema;
export const CurrentUserResponseSchema = z
  .object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string().optional(),
    displayName: z.string().nullish(),
    orgRole: OrganizationUserRoleSchema,
    /**
     * Platform standing, independent of any organization.
     *
     * Sent so a client can show or hide a platform surface. It grants nothing by
     * itself — `SystemRolesGuard` enforces it, and it never widens an
     * organization-scoped route.
     */
    systemRole: SystemRoleSchema,
    orgId: z.string().uuid(),
    /**
     * What this user may do in this organization, resolved server-side.
     *
     * Sent rather than derived so a client never holds its own copy of the
     * permission table: changing what a role can do reaches every client on
     * its next request, including a mobile build that cannot be redeployed.
     *
     * Authorization is unaffected — the API enforces regardless. This only
     * decides what the client renders.
     */
    permissions: z.array(PermissionSchema),
    /**
     * Feature flags active for this user, resolved server-side (PostHog when
     * configured, empty otherwise). Beside `permissions`, never mixed into it:
     * permissions say what a role MAY do, features say what is TURNED ON.
     */
    features: z.array(FeatureFlagSchema),
  })
  .strict();

export type AuthTokens = z.infer<typeof AuthTokensSchema>;

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;

export type RefreshRequest = z.infer<typeof RefreshRequestSchema>;
export type RefreshResponse = z.infer<typeof RefreshResponseSchema>;

export type LogoutRequest = z.infer<typeof LogoutRequestSchema>;
export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;

export type CurrentUserRequest = z.infer<typeof CurrentUserRequestSchema>;
export type CurrentUserResponse = z.infer<typeof CurrentUserResponseSchema>;

// Logout All Devices
/** Revokes every session for the caller; no input beyond the token. */
export const LogoutAllRequestSchema = EmptyRequestSchema;
export const LogoutAllResponseSchema = z.object({});

export type LogoutAllRequest = z.infer<typeof LogoutAllRequestSchema>;
export type LogoutAllResponse = z.infer<typeof LogoutAllResponseSchema>;

// Change Password (always logs out all other sessions)
export const ChangePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().regex(PASSWORD_REGEX, PASSWORD_ERROR_MESSAGE),
});

export const ChangePasswordResponseSchema = z.object({});

export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;
export type ChangePasswordResponse = z.infer<typeof ChangePasswordResponseSchema>;
