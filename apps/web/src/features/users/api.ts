import type {
  CreateUserRequest,
  CreateUserResponse,
  ListUsersRequest,
  ListUsersResponse,
  GetUserByIdResponse,
  UpdateUserByIdRequest,
  UpdateUserByIdResponse,
  DeleteUserByIdResponse,
  GetUserByIdRequest,
  DeleteUserByIdRequest,
} from '@pkg/contracts';
import { http, type HttpClient } from '@/shared/api/http';

/**
 * Factory kept exported so the global `api` aggregator can compose it.
 * Prefer the feature-local hooks (`use-users.ts`) over reaching for this directly.
 */
export const userResource = (client: HttpClient) => ({
  create: (dto: CreateUserRequest): Promise<CreateUserResponse> => client.post('/api/users', dto),

  list: (dto: ListUsersRequest): Promise<ListUsersResponse> =>
    client.get('/api/users', { params: dto }),

  get: (dto: GetUserByIdRequest): Promise<GetUserByIdResponse> =>
    client.get(`/api/users/${dto.id}`),

  update: (dto: UpdateUserByIdRequest): Promise<UpdateUserByIdResponse> =>
    client.patch(`/api/users/${dto.id}`, dto),

  remove: (dto: DeleteUserByIdRequest): Promise<DeleteUserByIdResponse> =>
    client.delete(`/api/users/${dto.id}`),
});

/** Bound instance the feature uses internally. */
export const usersApi = userResource(http);
