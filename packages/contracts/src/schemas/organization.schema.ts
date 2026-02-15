import { z } from 'zod';

// Single source of truth for organization user roles
export const ORGANIZATION_USER_ROLES = ['OWNER', 'ADMIN', 'MEMBER'] as const;
export const OrganizationUserRoleSchema = z.enum(ORGANIZATION_USER_ROLES);
export type OrganizationUserRole = z.infer<typeof OrganizationUserRoleSchema>;

// --- Organization Schema ---
const isoTimestamp = z
  .union([z.string(), z.date()])
  .transform((val) => (val instanceof Date ? val.toISOString() : val))
  .pipe(z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date string' }));

export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  role: OrganizationUserRoleSchema, // User's role in this org
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

export type Organization = z.infer<typeof OrganizationSchema>;

// --- List User's Organizations ---
export const ListOrgsRequestSchema = z.object({});
export const ListOrgsResponseSchema = z.object({
  data: z.array(OrganizationSchema),
  currentOrgId: z.string().uuid(),
});

export type ListOrgsRequest = z.infer<typeof ListOrgsRequestSchema>;
export type ListOrgsResponse = z.infer<typeof ListOrgsResponseSchema>;

// --- Get Organization by ID ---
export const GetOrgByIdRequestSchema = z.object({ id: z.string().uuid() }).strict();
export const GetOrgByIdResponseSchema = OrganizationSchema;

export type GetOrgByIdRequest = z.infer<typeof GetOrgByIdRequestSchema>;
export type GetOrgByIdResponse = z.infer<typeof GetOrgByIdResponseSchema>;

// --- Create Organization ---
export const CreateOrgRequestSchema = z
  .object({
    name: z.string().min(1).max(255),
  })
  .strict();

export const CreateOrgResponseSchema = OrganizationSchema;

export type CreateOrgRequest = z.infer<typeof CreateOrgRequestSchema>;
export type CreateOrgResponse = z.infer<typeof CreateOrgResponseSchema>;

// --- Update Organization ---
export const UpdateOrgRequestSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
});

export const UpdateOrgResponseSchema = OrganizationSchema;

export type UpdateOrgRequest = z.infer<typeof UpdateOrgRequestSchema>;
export type UpdateOrgResponse = z.infer<typeof UpdateOrgResponseSchema>;

// --- Delete Organization ---
export const DeleteOrgRequestSchema = z.object({ id: z.string().uuid() }).strict();
export const DeleteOrgResponseSchema = z.object({});

export type DeleteOrgRequest = z.infer<typeof DeleteOrgRequestSchema>;
export type DeleteOrgResponse = z.infer<typeof DeleteOrgResponseSchema>;

// --- Switch Organization ---
export const SwitchOrgRequestSchema = z.object({ orgId: z.string().uuid() }).strict();
export const SwitchOrgResponseSchema = z.object({});

export type SwitchOrgRequest = z.infer<typeof SwitchOrgRequestSchema>;
export type SwitchOrgResponse = z.infer<typeof SwitchOrgResponseSchema>;
