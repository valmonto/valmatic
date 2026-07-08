import type {
  ChangePasswordRequest,
  ChangePasswordResponse,
  CurrentUserResponse,
  LoginRequest,
  LoginResponse,
  LogoutAllResponse,
  LogoutRequest,
  LogoutResponse,
  RegisterRequest,
  RegisterResponse,
} from '@pkg/contracts';
import { api, type Api } from '@/shared/api/http';

/**
 * Typed auth resource — the mobile twin of the web feature's `api.ts`. Paths are
 * relative to the `/api` prefix. Note: token **refresh** is not here — it lives
 * in the http interceptor (`shared/api/http.ts`) on a bare client so a 401 can't
 * recurse. Mobile logout carries the refresh token in the body (token mode).
 */
export const authResource = (client: Api) => ({
  login: (dto: LoginRequest): Promise<LoginResponse> => client.post('/auth/login', dto),
  register: (dto: RegisterRequest): Promise<RegisterResponse> => client.post('/auth/register', dto),
  me: (): Promise<CurrentUserResponse> => client.get('/auth/me'),
  logout: (dto: LogoutRequest): Promise<LogoutResponse> => client.post('/auth/logout', dto),
  logoutAll: (): Promise<LogoutAllResponse> => client.post('/auth/logout-all'),
  changePassword: (dto: ChangePasswordRequest): Promise<ChangePasswordResponse> =>
    client.post('/auth/change-password', dto),
});

export const authApi = authResource(api);
