import { z } from 'zod';
import { PaginatedRequestSchema, PaginatedResponseSchema } from './pagination.schema';
import { OrganizationUserRoleSchema } from './organization.schema';
import { PASSWORD_REGEX, PASSWORD_ERROR_MESSAGE } from './auth.schema';

// Single source of truth for system roles (platform-wide)
export const SYSTEM_ROLES = ['USER', 'MODERATOR', 'ADMIN'] as const;
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
