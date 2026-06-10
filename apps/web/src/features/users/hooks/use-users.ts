import { useCallback } from 'react';
import { useSWRConfig } from 'swr';
import type {
  CreateUserRequest,
  DeleteUserByIdRequest,
  GetUserByIdResponse,
  ListUsersRequest,
  ListUsersResponse,
  UpdateUserByIdRequest,
} from '@pkg/contracts';
import { useAuth } from '@/shared/auth/auth-context';
import { useCachedRequest } from '@/shared/hooks/use-cached-request';
import { useActionRequest } from '@/shared/hooks/use-action-request';
import { useCan } from '@/shared/hooks/use-permissions';
import { usersApi } from '../api';

const DEFAULT_LIST_PARAMS: ListUsersRequest = { skip: 0, limit: 20, search: '' };

/**
 * Cache keys are namespaced by org so switching tenants can never surface
 * another org's cached rows. Every key shares the `org:<id>/users` prefix,
 * which `invalidate()` below uses to revalidate the whole domain at once.
 */
const orgUsersPrefix = (orgId: string | undefined) => (orgId ? `org:${orgId}/users` : null);
const listKey = (orgId: string | undefined, params: ListUsersRequest) =>
  orgUsersPrefix(orgId) && `${orgUsersPrefix(orgId)}?${JSON.stringify(params)}`;
const detailKey = (orgId: string | undefined, id: string | null) =>
  orgUsersPrefix(orgId) && id ? `${orgUsersPrefix(orgId)}/${id}` : null;

/**
 * Invalidate every cached user query (list + details) for the current org.
 * This replaces remount/refreshKey hacks — mutations call it on success and
 * SWR revalidates the affected views in place, preserving component state.
 */
function useInvalidateUsers() {
  const { mutate } = useSWRConfig();
  const { user } = useAuth();
  const prefix = orgUsersPrefix(user?.orgId);

  return useCallback(
    () => mutate((key) => typeof key === 'string' && prefix !== null && key.startsWith(prefix)),
    [mutate, prefix],
  );
}

export function useUsers(params: ListUsersRequest = DEFAULT_LIST_PARAMS) {
  const { user } = useAuth();
  const canList = useCan('user:list');

  return {
    canList,
    ...useCachedRequest<ListUsersResponse>({
      key: canList ? listKey(user?.orgId, params) : null,
      fetcher: () => usersApi.list(params),
    }),
  };
}

export function useUser(id: string | null) {
  const { user } = useAuth();
  const canList = useCan('user:list');

  return useCachedRequest<GetUserByIdResponse>({
    key: canList ? detailKey(user?.orgId, id) : null,
    fetcher: () => usersApi.get({ id: id! }),
  });
}

export function useCreateUser() {
  const invalidate = useInvalidateUsers();
  const req = useActionRequest(usersApi.create);
  const execute = async (dto: CreateUserRequest) => {
    const res = await req.execute(dto);
    if (!res.e) await invalidate();
    return res;
  };
  return { ...req, execute };
}

export function useUpdateUser() {
  const invalidate = useInvalidateUsers();
  const req = useActionRequest(usersApi.update);
  const execute = async (dto: UpdateUserByIdRequest) => {
    const res = await req.execute(dto);
    if (!res.e) await invalidate();
    return res;
  };
  return { ...req, execute };
}

export function useDeleteUser() {
  const invalidate = useInvalidateUsers();
  const req = useActionRequest(usersApi.remove);
  const execute = async (dto: DeleteUserByIdRequest) => {
    const res = await req.execute(dto);
    if (!res.e) await invalidate();
    return res;
  };
  return { ...req, execute };
}
