import { useCallback } from 'react';
import { useSWRConfig } from 'swr';
import type {
  GetUnreadCountResponse,
  ListNotificationsRequest,
  ListNotificationsResponse,
} from '@pkg/contracts';
import { useAuth } from '@/shared/auth/auth-context';
import { useCachedRequest } from '@/shared/hooks/use-cached-request';
import { useActionRequest } from '@/shared/hooks/use-action-request';
import { notificationsApi } from '../api';

const UNREAD_COUNT_POLL_MS = 30_000;

/**
 * Org-scoped cache keys (see users feature for the rationale). The list and the
 * unread-count both share the `org:<id>/notifications` prefix, so a single
 * `invalidate()` keeps the bell badge and the page list in sync after any
 * mutation — wherever the mutation was triggered from.
 */
const orgNotificationsPrefix = (orgId: string | undefined) =>
  orgId ? `org:${orgId}/notifications` : null;
const listKey = (orgId: string | undefined, params: ListNotificationsRequest) =>
  orgNotificationsPrefix(orgId) && `${orgNotificationsPrefix(orgId)}?${JSON.stringify(params)}`;
const unreadCountKey = (orgId: string | undefined) => {
  const prefix = orgNotificationsPrefix(orgId);
  return prefix && `${prefix}/unread-count`;
};

function useInvalidateNotifications() {
  const { mutate } = useSWRConfig();
  const { user } = useAuth();
  const prefix = orgNotificationsPrefix(user?.orgId);

  return useCallback(
    () => mutate((key) => typeof key === 'string' && prefix !== null && key.startsWith(prefix)),
    [mutate, prefix],
  );
}

export function useNotifications(
  params: ListNotificationsRequest,
  opts?: { enabled?: boolean },
) {
  const { user } = useAuth();
  const enabled = opts?.enabled ?? true;

  return useCachedRequest<ListNotificationsResponse>({
    key: enabled ? listKey(user?.orgId, params) : null,
    fetcher: () => notificationsApi.list(params),
  });
}

export function useUnreadCount() {
  const { user } = useAuth();

  return useCachedRequest<GetUnreadCountResponse>({
    key: unreadCountKey(user?.orgId),
    fetcher: () => notificationsApi.getUnreadCount(),
    config: { refreshInterval: UNREAD_COUNT_POLL_MS },
  });
}

export function useMarkNotificationRead() {
  const invalidate = useInvalidateNotifications();
  const req = useActionRequest(notificationsApi.markAsRead);
  const execute = async (id: string) => {
    const res = await req.execute(id);
    if (!res.e) await invalidate();
    return res;
  };
  return { ...req, execute };
}

export function useMarkAllNotificationsRead() {
  const invalidate = useInvalidateNotifications();
  const req = useActionRequest((_: void) => notificationsApi.markAllAsRead());
  const execute = async () => {
    const res = await req.execute(undefined);
    if (!res.e) await invalidate();
    return res;
  };
  return { ...req, execute };
}

export function useDeleteNotification() {
  const invalidate = useInvalidateNotifications();
  const req = useActionRequest(notificationsApi.delete);
  const execute = async (id: string) => {
    const res = await req.execute(id);
    if (!res.e) await invalidate();
    return res;
  };
  return { ...req, execute };
}

export function useDeleteAllNotifications() {
  const invalidate = useInvalidateNotifications();
  const req = useActionRequest((_: void) => notificationsApi.deleteAll());
  const execute = async () => {
    const res = await req.execute(undefined);
    if (!res.e) await invalidate();
    return res;
  };
  return { ...req, execute };
}
