import { z } from 'zod';
import { OrganizationUserRoleSchema } from './organization.schema';

/**
 * Password validation regex.
 * Requires: lowercase, uppercase, number, special character, min 8 chars.
 */
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

/**
 * Password validation error message (translation key).
 */
export const PASSWORD_ERROR_MESSAGE =
  'Password must be at least 8 characters and include uppercase, lowercase, number, and special character';

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

export const CurrentUserRequestSchema = z.object({});
export const CurrentUserResponseSchema = z
  .object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string().optional(),
    displayName: z.string().nullish(),
    role: OrganizationUserRoleSchema,
    orgId: z.string().uuid(),
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
export const LogoutAllRequestSchema = z.object({});
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
