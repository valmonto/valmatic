import { useCallback } from 'react';
import { useSWRConfig } from 'swr';
import type {
  CreateOrgRequest,
  DeleteOrgRequest,
  ListOrgsResponse,
  SwitchOrgRequest,
} from '@pkg/contracts';
import { useCachedRequest } from '@/shared/hooks/use-cached-request';
import { useActionRequest } from '@/shared/hooks/use-action-request';
import { orgApi } from '../api';

/**
 * The org list is account-level (every org the user belongs to + which one is
 * active), so unlike per-tenant data its key is NOT org-scoped.
 */
const ORGS_KEY = 'orgs';

/**
 * Reset every SWR cache entry. Switching (or deleting) the active org changes
 * the tenant, so `/api/auth/me` (which carries `orgId`) and all org-scoped keys
 * are now stale. Revalidating everything lets components re-key to the new org
 * reactively — replacing the old full-page `window.location.reload()`, which
 * threw away all SPA state.
 */
function useResetAllCaches() {
  const { mutate } = useSWRConfig();
  return useCallback(() => mutate(() => true, undefined, { revalidate: true }), [mutate]);
}

function useInvalidateOrgs() {
  const { mutate } = useSWRConfig();
  return useCallback(() => mutate(ORGS_KEY), [mutate]);
}

export function useOrgs() {
  return useCachedRequest<ListOrgsResponse>({
    key: ORGS_KEY,
    fetcher: () => orgApi.list({}),
  });
}

export function useSwitchOrg() {
  const resetAllCaches = useResetAllCaches();
  const req = useActionRequest(orgApi.switch);
  const execute = async (dto: SwitchOrgRequest) => {
    const res = await req.execute(dto);
    if (!res.e) await resetAllCaches();
    return res;
  };
  return { ...req, execute };
}

export function useCreateOrg() {
  const invalidateOrgs = useInvalidateOrgs();
  const req = useActionRequest(orgApi.create);
  const execute = async (dto: CreateOrgRequest) => {
    const res = await req.execute(dto);
    if (!res.e) await invalidateOrgs();
    return res;
  };
  return { ...req, execute };
}

export function useDeleteOrg() {
  // Deleting an org can remove the *active* one (the server then reassigns it),
  // so reset everything rather than just the list to keep auth/orgId consistent.
  const resetAllCaches = useResetAllCaches();
  const req = useActionRequest(orgApi.remove);
  const execute = async (dto: DeleteOrgRequest) => {
    const res = await req.execute(dto);
    if (!res.e) await resetAllCaches();
    return res;
  };
  return { ...req, execute };
}
