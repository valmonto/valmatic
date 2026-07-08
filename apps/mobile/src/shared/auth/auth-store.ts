import { create } from 'zustand';
import type { CurrentUserResponse, LoginRequest } from '@pkg/contracts';
import { authApi } from '@/features/auth/api';
import { setOnAuthError } from '@/shared/api/http';
import { clearTokens, getRefreshToken, setTokens } from '@/shared/api/tokens';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  user: CurrentUserResponse | null;
  /** Restore a session on app launch from tokens in secure storage. */
  bootstrap: () => Promise<void>;
  signIn: (credentials: LoginRequest) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => {
  // When the client can't refresh, it calls this — reflect the signed-out state.
  setOnAuthError(() => set({ status: 'unauthenticated', user: null }));

  async function loadUser(): Promise<void> {
    const user = await authApi.me();
    set({ status: 'authenticated', user });
  }

  return {
    status: 'loading',
    user: null,

    async bootstrap() {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        set({ status: 'unauthenticated', user: null });
        return;
      }
      try {
        // /auth/me will transparently refresh via the interceptor if the
        // access token has expired but the refresh token is still valid.
        await loadUser();
      } catch {
        await clearTokens();
        set({ status: 'unauthenticated', user: null });
      }
    },

    async signIn(credentials) {
      const data = await authApi.login(credentials);
      if (!data.tokens) {
        throw new Error('Login did not return tokens — is the X-Client header set?');
      }
      await setTokens(data.tokens);
      await loadUser();
    },

    async signOut() {
      const refreshToken = await getRefreshToken();
      try {
        await authApi.logout({ refreshToken: refreshToken ?? undefined });
      } catch {
        // Even if the server call fails, drop local session below.
      }
      await clearTokens();
      set({ status: 'unauthenticated', user: null });
    },
  };
});
