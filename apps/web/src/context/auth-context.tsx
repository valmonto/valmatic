import { createContext, useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { k } from '@pkg/locales';
import { api } from '@/api';
import type { CurrentUserResponse } from '@pkg/contracts';
import { useCachedRequest } from '@/hooks/use-cached-request';

interface AuthContextValue {
  user: CurrentUserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const _fetcher = useCallback(() => api.auth.me({}), []);

  const {
    data: user,
    error,
    isLoading,
    mutate,
  } = useCachedRequest<CurrentUserResponse>({
    key: '/api/auth/me',
    fetcher: _fetcher,
    minDuration: 200,
    config: {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
    },
  });

  const _logout = useCallback(
    async () => {
      try {
        await api.auth.logout({});
      } catch {
        // Show error but still log out locally
        toast.error(t(k.auth.errors.failedToLogOut));
      } finally {
        // Always clear local state to log user out
        mutate(undefined);
      }
    },
    [mutate, t],
  );

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    logout: _logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
}
