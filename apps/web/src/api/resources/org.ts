import type {
  CreateOrgRequest,
  CreateOrgResponse,
  DeleteOrgRequest,
  DeleteOrgResponse,
  GetOrgByIdRequest,
  GetOrgByIdResponse,
  ListOrgsRequest,
  ListOrgsResponse,
  UpdateOrgRequest,
  UpdateOrgResponse,
  SwitchOrgRequest,
  SwitchOrgResponse,
} from '@pkg/contracts';
import type { HttpClient } from '../http';

export const orgResource = (http: HttpClient) => ({
  list: (dto: ListOrgsRequest): Promise<ListOrgsResponse> => http.get('/api/orgs'),

  get: (dto: GetOrgByIdRequest): Promise<GetOrgByIdResponse> => http.get(`/api/orgs/${dto.id}`),

  create: (dto: CreateOrgRequest): Promise<CreateOrgResponse> => http.post('/api/orgs', dto),

  update: (dto: UpdateOrgRequest): Promise<UpdateOrgResponse> =>
    http.patch(`/api/orgs/${dto.id}`, dto),

  remove: (dto: DeleteOrgRequest): Promise<DeleteOrgResponse> =>
    http.delete(`/api/orgs/${dto.id}`),

  switch: (dto: SwitchOrgRequest): Promise<SwitchOrgResponse> =>
    http.post('/api/orgs/switch', dto),
});
