import { z } from 'zod';
import { EmptyRequestSchema } from './common.schema.js';
import { PermissionSchema } from './permission.schema.js';
import {
  AUTH_IDENTITY_PROVIDERS,
  PASSWORD_ERROR_MESSAGE,
  PASSWORD_REGEX,
} from '../constants/index.js';
import { OrganizationUserRoleSchema } from './organization.schema.js';
import { SystemRoleSchema } from './user.schema.js';
import { FEATURE_FLAGS } from '../constants/index.js';

// Defined in constants.ts (Zod-free) so the frontend can import them without
// pulling in the schema graph; re-exported here for existing callers.
export { PASSWORD_ERROR_MESSAGE, PASSWORD_REGEX } from '../constants/index.js';

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
  /**
   * The new organization's name, when the project has many (`GET
   * /auth/options` says `organizations: "many"`). Defaults to the person's
   * name. With one organization a sign-up joins it and this is ignored.
   */
  organizationName: z.string().min(1).max(255).optional(),
  /** The language the confirmation email is written in. Unknown ones fall back. */
  locale: z.string().min(2).max(10).optional(),
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
    /** Whether the owner confirmed the address by opening an emailed link. */
    emailVerified: z.boolean(),
    /**
     * Whether the account has a password. One made through Apple or Google
     * has none until a reset sets one; it confirms risky acts with the
     * provider instead.
     */
    hasPassword: z.boolean(),
    /** The Apple and Google accounts linked to this one. */
    providers: z.array(z.enum(AUTH_IDENTITY_PROVIDERS)),
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

// --- What this deployment can do (public) ---
// Clients ask before offering a link they could not follow through: without
// a mail service there is no "forgot password" email to send.
export const AuthOptionsResponseSchema = z.object({
  /** Whether this deployment can send the "forgot my password" email. */
  passwordResetEnabled: z.boolean(),
  /** Whether anyone may create an account (`AUTH_REGISTRATION_ENABLED`). */
  registrationEnabled: z.boolean(),
  /**
   * `many`: an account may belong to several organizations and each sign-up
   * founds its own (the `organizations` add-on). `one`: every account joins
   * the project's one organization.
   */
  organizations: z.enum(['one', 'many']),
  /** The sign-in providers this deployment can verify. No ids, no secrets. */
  providers: z.array(z.enum(AUTH_IDENTITY_PROVIDERS)),
});

export type AuthOptionsResponse = z.infer<typeof AuthOptionsResponseSchema>;

// --- "I forgot my password" ---
// Ask for a link by email; the link opens a page that checks it and sets a
// new password. The request answers the same whether or not the address has
// an account.
export const PasswordResetRequestSchema = z
  .object({
    email: z.string().email().max(255),
    /** The language the email is written in. Unknown ones fall back. */
    locale: z.string().min(2).max(10).optional(),
  })
  .strict();
export const PasswordResetRequestResponseSchema = z.object({});

/** The token is 32 random bytes in base64url: 43 characters. */
const ResetTokenSchema = z.string().min(20).max(200);

export const PasswordResetCheckRequestSchema = z.object({ token: ResetTokenSchema }).strict();
export const PasswordResetCheckResponseSchema = z.object({ valid: z.boolean() });

export const PasswordResetConfirmRequestSchema = z
  .object({
    token: ResetTokenSchema,
    newPassword: z.string().regex(PASSWORD_REGEX, PASSWORD_ERROR_MESSAGE),
  })
  .strict();
export const PasswordResetConfirmResponseSchema = z.object({});

export type PasswordResetRequest = z.infer<typeof PasswordResetRequestSchema>;
export type PasswordResetRequestResponse = z.infer<typeof PasswordResetRequestResponseSchema>;
export type PasswordResetCheckRequest = z.infer<typeof PasswordResetCheckRequestSchema>;
export type PasswordResetCheckResponse = z.infer<typeof PasswordResetCheckResponseSchema>;
export type PasswordResetConfirmRequest = z.infer<typeof PasswordResetConfirmRequestSchema>;
export type PasswordResetConfirmResponse = z.infer<typeof PasswordResetConfirmResponseSchema>;

// --- Confirming the email address ---
// Someone who signed up with an address and a password is mailed a link.
// Nothing waits for it: the account works at once. Until it is opened the app
// shows the address, can send the link again, and lets the address be changed
// — only then, while nobody has proven it is theirs.

/** Send the link again, to the address the account has now. Signed in. */
export const EmailVerificationResendRequestSchema = z
  .object({ locale: z.string().min(2).max(10).optional() })
  .strict();
export const EmailVerificationResendResponseSchema = z.object({
  /** False when the daily limit is reached or this deployment cannot send mail. */
  sent: z.boolean(),
});

/** Open the link. Public: the link may be opened on another device. */
export const EmailVerificationConfirmRequestSchema = z.object({ token: ResetTokenSchema }).strict();
export const EmailVerificationConfirmResponseSchema = z.object({
  /** The address that is now confirmed. */
  email: z.string().email(),
});

/** Correct an address nobody has confirmed yet, and mail the link there. Signed in. */
export const ChangeUnverifiedEmailRequestSchema = z
  .object({
    email: z.string().email().max(255),
    locale: z.string().min(2).max(10).optional(),
  })
  .strict();
export const ChangeUnverifiedEmailResponseSchema = z.object({ email: z.string().email() });

export type EmailVerificationResendRequest = z.infer<typeof EmailVerificationResendRequestSchema>;
export type EmailVerificationResendResponse = z.infer<typeof EmailVerificationResendResponseSchema>;
export type EmailVerificationConfirmRequest = z.infer<typeof EmailVerificationConfirmRequestSchema>;
export type EmailVerificationConfirmResponse = z.infer<
  typeof EmailVerificationConfirmResponseSchema
>;
export type ChangeUnverifiedEmailRequest = z.infer<typeof ChangeUnverifiedEmailRequestSchema>;
export type ChangeUnverifiedEmailResponse = z.infer<typeof ChangeUnverifiedEmailResponseSchema>;

