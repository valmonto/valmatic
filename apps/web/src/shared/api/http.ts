import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';

export class HttpClient {
  private instance: AxiosInstance;
  private onUnauthorized?: () => void;

  constructor(config: { baseURL: string }) {
    this.instance = axios.create({
      baseURL: config.baseURL,
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
    });

    this.instance.interceptors.response.use(
      (res) => res,
      (error) => {
        // Don't redirect on 401 for auth endpoints - let the UI handle those errors
        const isAuthEndpoint = error.config?.url?.includes('/auth/');
        if (axios.isAxiosError(error) && error.response?.status === 401 && !isAuthEndpoint) {
          // The server transparently rotates the access token via the refresh cookie
          // inside its auth guard, so a 401 reaching us means the session is truly
          // dead. Hand off to the app's handler for a soft SPA redirect + cache reset;
          // fall back to a hard redirect only if nothing is registered yet (early boot).
          if (this.onUnauthorized) this.onUnauthorized();
          else window.location.href = '/auth/login';
        }

        // Extract backend error message for better UX
        if (axios.isAxiosError(error) && error.response?.data?.message) {
          const message = error.response.data.message;
          const apiError = new Error(Array.isArray(message) ? message[0] : message);
          return Promise.reject(apiError);
        }

        return Promise.reject(error);
      },
    );
  }

  /**
   * Register how the app reacts to an unrecoverable 401 (dead session). Wired up
   * once at startup (see lib/router) so the client can react without a full reload.
   */
  setUnauthorizedHandler(handler: () => void) {
    this.onUnauthorized = handler;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const res: AxiosResponse<T> = await this.instance.get(url, config);
    return res.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const res: AxiosResponse<T> = await this.instance.post(url, data, config);
    return res.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const res: AxiosResponse<T> = await this.instance.put(url, data, config);
    return res.data;
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const res: AxiosResponse<T> = await this.instance.patch(url, data, config);
    return res.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const res: AxiosResponse<T> = await this.instance.delete(url, config);
    return res.data;
  }

  async postForm<T>(url: string, data: FormData, config?: AxiosRequestConfig): Promise<T> {
    const res: AxiosResponse<T> = await this.instance.post(url, data, {
      ...config,
      headers: { ...config?.headers, 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }
}

export const http = new HttpClient({ baseURL: '' });
