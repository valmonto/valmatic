import type {
  AdminDeleteOrgRequest,
  AdminDeleteOrgResponse,
  AdminListOrgsRequest,
  AdminListOrgsResponse,
} from '@pkg/contracts';
import { http, type HttpClient } from '@/shared/api/http';

/** Platform surface — every endpoint behind @SystemRoles(ADMIN) on the API. */
export const adminResource = (client: HttpClient) => ({
  listOrgs: (dto: AdminListOrgsRequest): Promise<AdminListOrgsResponse> =>
    client.get('/api/admin/orgs', { params: dto }),

  deleteOrg: (dto: AdminDeleteOrgRequest): Promise<AdminDeleteOrgResponse> =>
    client.delete(`/api/admin/orgs/${dto.id}`),
});

export const adminApi = adminResource(http);
