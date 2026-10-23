import type {
  AuthOptionsResponse,
  PasswordResetCheckResponse,
  PasswordResetConfirmRequest,
  PasswordResetRequest,
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
import { http, type HttpClient } from '@/shared/api/http';

/**
 * Factory kept exported so the global `api` aggregator can compose it.
 * Prefer the feature-local hooks (`use-auth-actions.ts`) over reaching here.
 */
export const authResource = (client: HttpClient) => ({
  login: (dto: LoginRequest): Promise<LoginResponse> => client.post('/api/auth/login', dto),
  register: (dto: RegisterRequest): Promise<RegisterResponse> =>
    client.post('/api/auth/register', dto),
  me: (_dto: CurrentUserRequest): Promise<CurrentUserResponse> => client.get('/api/auth/me'),
  logout: (_dto: LogoutRequest): Promise<LogoutResponse> => client.post('/api/auth/logout'),
  logoutAll: (dto: LogoutAllRequest): Promise<LogoutAllResponse> =>
    client.post('/api/auth/logout-all', dto),
  changePassword: (dto: ChangePasswordRequest): Promise<ChangePasswordResponse> =>
    client.post('/api/auth/change-password', dto),
  options: (): Promise<AuthOptionsResponse> => client.get('/api/auth/options'),
  requestPasswordReset: (dto: PasswordResetRequest): Promise<Record<string, never>> =>
    client.post('/api/auth/password-reset/request', dto),
  checkPasswordReset: (token: string): Promise<PasswordResetCheckResponse> =>
    client.post('/api/auth/password-reset/check', { token }),
  confirmPasswordReset: (dto: PasswordResetConfirmRequest): Promise<Record<string, never>> =>
    client.post('/api/auth/password-reset/confirm', dto),
});

/** Bound instance the feature uses internally. */
export const authApi = authResource(http);
