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
import type { HttpClient } from '../http';

export const userResource = (http: HttpClient) => ({
  create: (dto: CreateUserRequest): Promise<CreateUserResponse> => http.post('/api/users', dto),

  list: (dto: ListUsersRequest): Promise<ListUsersResponse> =>
    http.get('/api/users', { params: dto }),

  get: (dto: GetUserByIdRequest): Promise<GetUserByIdResponse> => http.get(`/api/users/${dto.id}`),

  update: (dto: UpdateUserByIdRequest): Promise<UpdateUserByIdResponse> =>
    http.patch(`/api/users/${dto.id}`, dto),

  remove: (dto: DeleteUserByIdRequest): Promise<DeleteUserByIdResponse> =>
    http.delete(`/api/users/${dto.id}`),
});
