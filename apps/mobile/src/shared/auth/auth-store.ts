import { create } from 'zustand';
import type { CurrentUserResponse, LoginRequest } from '@pkg/contracts';
import { authApi } from '@/features/auth/api';
import { saysNothingAboutSession, setOnAuthError } from '@/shared/api/http';
import { clearTokens, cookieSession, getRefreshToken, setTokens } from '@/shared/api/tokens';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

/** How soon to ask again when launch could not reach the server. */
const BOOTSTRAP_RETRY_MS = 5_000;

interface AuthState {
  status: AuthStatus;
  user: CurrentUserResponse | null;
  /** Restore a session on app launch from tokens in secure storage. */
  bootstrap: () => Promise<void>;
  signIn: (credentials: LoginRequest) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => {
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
      if (cookieSession) {
        // A browser holds no token: the server says whether its cookies are a
        // session. Tokens an older web build left in localStorage are removed.
        await clearTokens();
        try {
          await loadUser();
        } catch (error) {
          if (saysNothingAboutSession(error)) {
            setTimeout(() => void get().bootstrap(), BOOTSTRAP_RETRY_MS);
            return;
          }
          set({ status: 'unauthenticated', user: null });
        }
        return;
      }
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        set({ status: 'unauthenticated', user: null });
        return;
      }
      try {
        // /auth/me will transparently refresh via the interceptor if the
        // access token has expired but the refresh token is still valid.
        await loadUser();
      } catch (error) {
        // No answer (no network, a timeout), the server failing or busy (a
        // deploy's 502, a 429), or a refresh that could not be tried just
        // now: none of that says anything about the account. The session is
        // kept and asked about again shortly; the splash screen stays up
        // meanwhile. Only an answer that refuses the session ends it.
        if (saysNothingAboutSession(error)) {
          setTimeout(() => void get().bootstrap(), BOOTSTRAP_RETRY_MS);
          return;
        }
        await clearTokens();
        set({ status: 'unauthenticated', user: null });
      }
    },

    async signIn(credentials) {
      const data = await authApi.login(credentials);
      // A browser was handed httpOnly cookies, not tokens (see `cookieSession`).
      if (!cookieSession && !data.tokens) {
        throw new Error('Login did not return tokens — is the X-Client header set?');
      }
      if (data.tokens) await setTokens(data.tokens);
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
