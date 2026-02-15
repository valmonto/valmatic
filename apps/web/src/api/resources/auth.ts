import type {
  ChangePasswordRequest,
  ChangePasswordResponse,
  CurrentUserRequest,
  CurrentUserResponse,
  LoginRequest,
  LoginResponse,
  LogoutAllRequest,
  LogoutAllResponse,
  LogoutRequest,
  LogoutResponse,
  RegisterRequest,
  RegisterResponse,
} from '@pkg/contracts';
import type { HttpClient } from '../http';

export const authResource = (http: HttpClient) => ({
  login: (dto: LoginRequest): Promise<LoginResponse> => http.post('/api/auth/login', dto),
  register: (dto: RegisterRequest): Promise<RegisterResponse> =>
    http.post('/api/auth/register', dto),
  me: (dto: CurrentUserRequest): Promise<CurrentUserResponse> => http.get('/api/auth/me'),
  logout: (dto: LogoutRequest): Promise<LogoutResponse> => http.post('/api/auth/logout'),
  logoutAll: (dto: LogoutAllRequest): Promise<LogoutAllResponse> =>
    http.post('/api/auth/logout-all', dto),
  changePassword: (dto: ChangePasswordRequest): Promise<ChangePasswordResponse> =>
    http.post('/api/auth/change-password', dto),
});
