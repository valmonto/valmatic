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
import { http, type HttpClient } from '@/shared/api/http';

/**
 * Factory kept exported so the global `api` aggregator can compose it.
 * Prefer the feature-local hooks (`use-orgs.ts`) over reaching here.
 */
export const orgResource = (client: HttpClient) => ({
  list: (_dto: ListOrgsRequest): Promise<ListOrgsResponse> => client.get('/api/orgs'),

  get: (dto: GetOrgByIdRequest): Promise<GetOrgByIdResponse> => client.get(`/api/orgs/${dto.id}`),

  create: (dto: CreateOrgRequest): Promise<CreateOrgResponse> => client.post('/api/orgs', dto),

  // update/delete address the ACTIVE organization only — the API enforces that
  // the id in the path equals the session's org, so switch first to administer
  // another one.
  update: (dto: UpdateOrgRequest): Promise<UpdateOrgResponse> =>
    client.patch(`/api/orgs/${dto.orgId}`, dto),

  remove: (dto: DeleteOrgRequest): Promise<DeleteOrgResponse> =>
    client.delete(`/api/orgs/${dto.orgId}`),

  switch: (dto: SwitchOrgRequest): Promise<SwitchOrgResponse> =>
    client.post('/api/orgs/switch', dto),
});

/** Bound instance the feature uses internally. */
export const orgApi = orgResource(http);
