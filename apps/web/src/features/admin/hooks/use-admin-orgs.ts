import { useCallback } from 'react';
import { useSWRConfig } from 'swr';
import type { AdminDeleteOrgRequest, AdminListOrgsResponse } from '@pkg/contracts';
import { useCachedRequest } from '@/shared/hooks/use-cached-request';
import { useActionRequest } from '@/shared/hooks/use-action-request';
import { adminApi } from '../api';

const ADMIN_ORGS_KEY = 'admin/orgs';

export function useAdminOrgs() {
  return useCachedRequest<AdminListOrgsResponse>({
    key: ADMIN_ORGS_KEY,
    fetcher: () => adminApi.listOrgs({ skip: 0, limit: 100 }),
  });
}

export function useAdminDeleteOrg() {
  const { mutate } = useSWRConfig();
  const req = useActionRequest(adminApi.deleteOrg);

  const execute = useCallback(
    async (dto: AdminDeleteOrgRequest) => {
      const res = await req.execute(dto);
      if (!res.e) await mutate(ADMIN_ORGS_KEY);
      return res;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mutate, req.execute],
  );

  return { ...req, execute };
}
