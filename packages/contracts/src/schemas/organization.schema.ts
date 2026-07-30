import { z } from 'zod';
import { ORGANIZATION_USER_ROLES } from '../constants';
import { EmptyRequestSchema } from './common.schema';
import { PaginatedRequestSchema, PaginatedResponseSchema } from './pagination.schema';

// Single source of truth for organization user roles
export { ORGANIZATION_USER_ROLES } from '../constants';
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
export const ListOrgsRequestSchema = EmptyRequestSchema;
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
// The field is `orgId`, not `id`: the route is /orgs/:orgId, which puts it
// under ActiveOrgGuard — update addresses the ACTIVE organization only, so
// @Permissions judges the same organization the write lands in. Reading stays
// cross-org (`id` above); administering does not.
export const UpdateOrgRequestSchema = z
  .object({
    orgId: z.string().uuid(),
    name: z.string().min(1).max(255).optional(),
  })
  .strict();

export const UpdateOrgResponseSchema = OrganizationSchema;

export type UpdateOrgRequest = z.infer<typeof UpdateOrgRequestSchema>;
export type UpdateOrgResponse = z.infer<typeof UpdateOrgResponseSchema>;

// --- Admin: List All Organizations ---
// Platform surface (`/admin/orgs`, @SystemRoles(ADMIN)) — deliberately NOT part
// of the tenant routes above. Organization users, including OWNERs, cannot
// delete organizations; a platform admin can delete any of them. Deletion was
// removed from the tenant surface entirely, so there is no `org:delete`
// permission — holding every org permission still does not grant it.
export const AdminOrgSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  memberCount: z.number().int(),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

export type AdminOrg = z.infer<typeof AdminOrgSchema>;

export const AdminListOrgsRequestSchema = PaginatedRequestSchema.strict();
export const AdminListOrgsResponseSchema = PaginatedResponseSchema(AdminOrgSchema);

export type AdminListOrgsRequest = z.infer<typeof AdminListOrgsRequestSchema>;
export type AdminListOrgsResponse = z.infer<typeof AdminListOrgsResponseSchema>;

// --- Admin: Delete Organization ---
// `id`, not `orgId`: this route addresses ANY organization, so it must stay
// outside ActiveOrgGuard's tenant rule. Deleting the org the admin is switched
// into is refused instead of re-homed — switch first.
export const AdminDeleteOrgRequestSchema = z.object({ id: z.string().uuid() }).strict();
export const AdminDeleteOrgResponseSchema = z.object({});

export type AdminDeleteOrgRequest = z.infer<typeof AdminDeleteOrgRequestSchema>;
export type AdminDeleteOrgResponse = z.infer<typeof AdminDeleteOrgResponseSchema>;

// --- Switch Organization ---
export const SwitchOrgRequestSchema = z.object({ orgId: z.string().uuid() }).strict();
export const SwitchOrgResponseSchema = z.object({});

export type SwitchOrgRequest = z.infer<typeof SwitchOrgRequestSchema>;
export type SwitchOrgResponse = z.infer<typeof SwitchOrgResponseSchema>;
