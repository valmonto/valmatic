import { useCallback } from 'react';
import { useSWRConfig } from 'swr';
import type { CreateApiKeyRequest, ListApiKeysResponse, RevokeApiKeyRequest } from '@pkg/contracts';
import { useCachedRequest } from '@/shared/hooks/use-cached-request';
import { useActionRequest } from '@/shared/hooks/use-action-request';
import { adminApi } from '../api';

const ADMIN_API_KEYS_KEY = 'admin/api-keys';

export function useAdminApiKeys() {
  return useCachedRequest<ListApiKeysResponse>({
    key: ADMIN_API_KEYS_KEY,
    fetcher: () => adminApi.listApiKeys(),
  });
}

export function useAdminCreateApiKey() {
  const { mutate } = useSWRConfig();
  const req = useActionRequest(adminApi.createApiKey);

  const execute = useCallback(
    async (dto: CreateApiKeyRequest) => {
      const res = await req.execute(dto);
      if (!res.e) await mutate(ADMIN_API_KEYS_KEY);
      return res;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mutate, req.execute],
  );

  return { ...req, execute };
}

export function useAdminRevokeApiKey() {
  const { mutate } = useSWRConfig();
  const req = useActionRequest(adminApi.revokeApiKey);

  const execute = useCallback(
    async (dto: RevokeApiKeyRequest) => {
      const res = await req.execute(dto);
      if (!res.e) await mutate(ADMIN_API_KEYS_KEY);
      return res;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mutate, req.execute],
  );

  return { ...req, execute };
}
