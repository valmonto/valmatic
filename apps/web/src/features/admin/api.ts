import type {
  AdminDeleteOrgRequest,
  AdminDeleteOrgResponse,
  AdminListOrgsRequest,
  AdminListOrgsResponse,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  ListApiKeysResponse,
  RevokeApiKeyRequest,
  RevokeApiKeyResponse,
} from '@pkg/contracts';
import { http, type HttpClient } from '@/shared/api/http';

/** Platform surface — every endpoint behind @SystemRoles(ADMIN) on the API. */
export const adminResource = (client: HttpClient) => ({
  listOrgs: (dto: AdminListOrgsRequest): Promise<AdminListOrgsResponse> =>
    client.get('/api/admin/orgs', { params: dto }),

  deleteOrg: (dto: AdminDeleteOrgRequest): Promise<AdminDeleteOrgResponse> =>
    client.delete(`/api/admin/orgs/${dto.id}`),

  listApiKeys: (): Promise<ListApiKeysResponse> => client.get('/api/admin/api-keys'),

  createApiKey: (dto: CreateApiKeyRequest): Promise<CreateApiKeyResponse> =>
    client.post('/api/admin/api-keys', dto),

  revokeApiKey: (dto: RevokeApiKeyRequest): Promise<RevokeApiKeyResponse> =>
    client.delete(`/api/admin/api-keys/${dto.id}`),
});

export const adminApi = adminResource(http);
