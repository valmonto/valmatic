import { z } from 'zod';
import { ProviderProofSchema } from './provider-proof.schema.js';
// Sourced from ../constants rather than ./auth.schema: auth.schema needs
// SystemRoleSchema from here, and importing the constants back out of it would
// close a cycle that leaves one of the two schemas undefined at evaluation.
import { SYSTEM_ROLES, PASSWORD_REGEX, PASSWORD_ERROR_MESSAGE } from '../constants/index.js';
import { PaginatedRequestSchema, PaginatedResponseSchema } from './pagination.schema.js';
import { OrganizationUserRoleSchema } from './organization.schema.js';

// Single source of truth for system roles (platform-wide)
export { SYSTEM_ROLES } from '../constants/index.js';
export const SystemRoleSchema = z.enum(SYSTEM_ROLES);
export type SystemRole = z.infer<typeof SystemRoleSchema>;

// Password validation (same as registration)
const PasswordSchema = z.string().regex(PASSWORD_REGEX, PASSWORD_ERROR_MESSAGE);

const isoTimestamp = z
  .union([z.string(), z.date()])
  .transform((val) => (val instanceof Date ? val.toISOString() : val))
  .pipe(z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date string' }));

// User within an organization (includes their org role)
export const OrgUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(255),
  displayName: z.string().max(255).nullish(),
  phone: z.string().max(50).nullish(),
  role: OrganizationUserRoleSchema, // Role within the organization
  joinedAt: isoTimestamp,
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
  /** When a platform admin disabled the account; null while it is active. */
  disabledAt: isoTimestamp.nullish(),
});

export type OrgUser = z.infer<typeof OrgUserSchema>;

// --- Create User (creates user + adds to org) ---
export const CreateUserRequestSchema = z
  .object({
    email: z.string().email(),
    name: z.string().min(1).max(255),
    password: PasswordSchema,
    phone: z.string().max(50).optional(),
    role: OrganizationUserRoleSchema,
  })
  .strict();

export const CreateUserResponseSchema = OrgUserSchema;

export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;
export type CreateUserResponse = z.infer<typeof CreateUserResponseSchema>;

// --- List Users (in current org) ---
export const ListUsersRequestSchema = PaginatedRequestSchema.extend({
  role: OrganizationUserRoleSchema.optional(),
  search: z.string().max(100).optional().default(''),
}).strict();

export const ListUsersResponseSchema = PaginatedResponseSchema(OrgUserSchema);

export type ListUsersRequest = z.infer<typeof ListUsersRequestSchema>;
export type ListUsersResponse = z.infer<typeof ListUsersResponseSchema>;

// --- Get User by ID ---
export const GetUserByIdRequestSchema = z.object({ id: z.string().uuid() }).strict();
export const GetUserByIdResponseSchema = OrgUserSchema;

export type GetUserByIdRequest = z.infer<typeof GetUserByIdRequestSchema>;
export type GetUserByIdResponse = z.infer<typeof GetUserByIdResponseSchema>;

// --- Update User (role is in organization_user) ---
export const UpdateUserByIdRequestSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  displayName: z.string().max(255).nullish(),
  phone: z.string().max(50).nullish(),
  role: OrganizationUserRoleSchema.optional(),
});

export const UpdateUserByIdResponseSchema = OrgUserSchema;

export type UpdateUserByIdRequest = z.infer<typeof UpdateUserByIdRequestSchema>;
export type UpdateUserByIdResponse = z.infer<typeof UpdateUserByIdResponseSchema>;

// --- Remove User from Org ---
export const DeleteUserByIdRequestSchema = z.object({ id: z.string().uuid() }).strict();
export const DeleteUserByIdResponseSchema = z.object({});

export type DeleteUserByIdRequest = z.infer<typeof DeleteUserByIdRequestSchema>;
export type DeleteUserByIdResponse = z.infer<typeof DeleteUserByIdResponseSchema>;

// --- Disable / enable an account (platform admins) ---
// Platform-wide: an account can belong to several organizations, so turning
// it off is not one organization's decision (see AdminUserController).
export const AdminDisableUserRequestSchema = z
  .object({
    id: z.string().uuid(),
    /** Why, in the admin's own words. Shown back to admins, never to the user. */
    reason: z.string().trim().max(500).optional(),
  })
  .strict();
export const AdminDisableUserResponseSchema = z.object({});
export const AdminEnableUserRequestSchema = z.object({ id: z.string().uuid() }).strict();
export const AdminEnableUserResponseSchema = z.object({});

export type AdminDisableUserRequest = z.infer<typeof AdminDisableUserRequestSchema>;
export type AdminDisableUserResponse = z.infer<typeof AdminDisableUserResponseSchema>;
export type AdminEnableUserRequest = z.infer<typeof AdminEnableUserRequestSchema>;
export type AdminEnableUserResponse = z.infer<typeof AdminEnableUserResponseSchema>;

// --- One's own account: delete it, download a copy of it ---
// The account is always the session's own; nothing in the request names it.

/**
 * Proof again that it is the owner: a session left open on a shared computer
 * is not consent. The password, or — for an account made through Apple or
 * Google, which has none — a fresh sign-in with a provider linked to it.
 */
export const DeleteAccountRequestSchema = z.union([
  z.object({ password: z.string().min(1) }).strict(),
  ProviderProofSchema,
]);
export const DeleteAccountResponseSchema = z.object({});

export type DeleteAccountRequest = z.infer<typeof DeleteAccountRequestSchema>;
export type DeleteAccountResponse = z.infer<typeof DeleteAccountResponseSchema>;

export const ExportAccountRequestSchema = z.object({}).strict();

/**
 * Everything kept about the person, as one JSON document (GDPR art. 15/20).
 * Files they uploaded belong to their organizations and are listed, not
 * included. Secrets (password hash, API key hashes, tokens) never appear.
 */
export const AccountExportSchema = z.object({
  exportedAt: z.string(),
  account: z.object({
    id: z.string().uuid(),
    email: z.string(),
    name: z.string(),
    displayName: z.string().nullable(),
    phone: z.string().nullable(),
    systemRole: z.string(),
    emailVerifiedAt: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
  organizations: z.array(
    z.object({ id: z.string().uuid(), name: z.string(), role: z.string(), joinedAt: z.string() }),
  ),
  notifications: z.array(
    z.object({
      id: z.string().uuid(),
      orgId: z.string().uuid().nullable(),
      type: z.string(),
      title: z.string(),
      message: z.string().nullable(),
      link: z.string().nullable(),
      createdAt: z.string(),
    }),
  ),
  attachments: z.array(
    z.object({
      id: z.string().uuid(),
      orgId: z.string().uuid(),
      fileName: z.string().nullable(),
      mimeType: z.string(),
      sizeBytes: z.number(),
      createdAt: z.string(),
    }),
  ),
  signInProviders: z.array(
    z.object({
      provider: z.string(),
      email: z.string().nullable(),
      createdAt: z.string(),
      lastSeenAt: z.string(),
    }),
  ),
  apiKeys: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      prefix: z.string(),
      scopes: z.array(z.string()),
      lastUsedAt: z.string().nullable(),
      revokedAt: z.string().nullable(),
      createdAt: z.string(),
    }),
  ),
});

export type ExportAccountRequest = z.infer<typeof ExportAccountRequestSchema>;
export type AccountExport = z.infer<typeof AccountExportSchema>;
