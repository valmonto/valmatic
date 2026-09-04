import {
  create,
  isAxiosError,
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { AuthTokens, RefreshResponse } from '@pkg/contracts';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './tokens';

/**
 * API base URL. Point EXPO_PUBLIC_API_URL at the machine running the API — on a
 * physical device / emulator this must be your LAN IP (e.g. http://192.168.1.20:3000),
 * NOT localhost. The API mounts everything under the `/api` global prefix.
 */
const API_ORIGIN = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
export const API_BASE_URL = `${API_ORIGIN.replace(/\/$/, '')}/api`;

/** Marks the mobile client so the API returns tokens in the body, not cookies. */
const CLIENT_HEADER = { 'X-Client': 'mobile' } as const;

// Called when refresh fails and the session is unrecoverable, so the auth store
// can drop the user to the login screen. Registered by the auth store.
let onAuthError: (() => void) | null = null;
export function setOnAuthError(cb: (() => void) | null): void {
  onAuthError = cb;
}

export const http: AxiosInstance = create({
  baseURL: API_BASE_URL,
  headers: CLIENT_HEADER,
});

/**
 * Thin `.data`-unwrapping wrapper over `http` — the mobile equivalent of the
 * web app's `HttpClient`. Feature `api.ts` factories call these so hooks get the
 * response body directly. Paths are relative to `/api` (e.g. `/notifications`).
 */
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    http.get<T>(url, config).then((r) => r.data),
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    http.post<T>(url, data, config).then((r) => r.data),
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    http.patch<T>(url, data, config).then((r) => r.data),
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    http.put<T>(url, data, config).then((r) => r.data),
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    http.delete<T>(url, config).then((r) => r.data),
};

export type Api = typeof api;

// Attach the current access token to every request.
http.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// A bare client (no interceptors) for the refresh call itself, so a 401 from
// /auth/refresh can't recurse back into this same logic.
const refreshClient = create({ baseURL: API_BASE_URL, headers: CLIENT_HEADER });

// Single-flight: concurrent 401s share one refresh round-trip.
let refreshPromise: Promise<AuthTokens | 'unrecoverable' | null> | null = null;

/**
 * 'unrecoverable' = the server DEFINITIVELY rejected the refresh token
 * (401/403) — only then may stored credentials be destroyed. A network blip,
 * timeout or 5xx during refresh returns null and KEEPS the tokens: they are
 * very likely still valid, and destroying them on a transient failure is what
 * used to force mobile users to re-enter credentials after any flaky moment.
 */
async function refreshTokens(): Promise<AuthTokens | 'unrecoverable' | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return 'unrecoverable';

  try {
    const { data } = await refreshClient.post<RefreshResponse>('/auth/refresh', { refreshToken });
    if (!data.tokens) return 'unrecoverable';
    await setTokens(data.tokens);
    return data.tokens;
  } catch (err) {
    const status = isAxiosError(err) ? err.response?.status : undefined;
    if (status === 401 || status === 403) return 'unrecoverable';
    return null; // transient — keep tokens, the next request retries
  }
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    // Only try to recover from a 401 once per request.
    if (error.response?.status !== 401 || !original || original._retry) {
      return Promise.reject(error);
    }
    original._retry = true;

    refreshPromise ??= refreshTokens().finally(() => {
      refreshPromise = null;
    });
    const tokens = await refreshPromise;

    if (tokens === 'unrecoverable') {
      await clearTokens();
      onAuthError?.();
      return Promise.reject(error);
    }
    if (!tokens) {
      // Transient refresh failure: fail THIS request, keep the session.
      return Promise.reject(error);
    }

    original.headers.set('Authorization', `Bearer ${tokens.accessToken}`);
    return http(original);
  },
);
