import { useCallback } from 'react';
import { useSWRConfig } from 'swr';
import type { LoginRequest, RegisterRequest } from '@pkg/contracts';
import { useActionRequest } from '@/shared/hooks/use-action-request';
import { AUTH_ME_KEY } from '@/shared/auth/auth-context';
import { authApi } from '../api';

/**
 * Revalidate the current-user query. After a successful login/register the
 * session cookie is set, so re-fetching `me` flips `useAuth().isAuthenticated`
 * to true — the auth views then redirect via their existing <Navigate>, with
 * no full-page `window.location` reload.
 */
function useRevalidateMe() {
  const { mutate } = useSWRConfig();
  return useCallback(() => mutate(AUTH_ME_KEY), [mutate]);
}

export function useLogin() {
  const revalidateMe = useRevalidateMe();
  const req = useActionRequest((dto: LoginRequest) => authApi.login(dto));
  const execute = async (dto: LoginRequest) => {
    const res = await req.execute(dto);
    if (!res.e) await revalidateMe();
    return res;
  };
  return { ...req, execute };
}

export function useRegister() {
  const revalidateMe = useRevalidateMe();
  const req = useActionRequest((dto: RegisterRequest) => authApi.register(dto));
  const execute = async (dto: RegisterRequest) => {
    const res = await req.execute(dto);
    if (!res.e) await revalidateMe();
    return res;
  };
  return { ...req, execute };
}
