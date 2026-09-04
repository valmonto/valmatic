import type {
  GetUnreadCountResponse,
  ListNotificationsRequest,
  ListNotificationsResponse,
} from '@pkg/contracts';
import { useAuthStore } from '@/shared/auth/auth-store';
import { useActionRequest } from '@/shared/hooks/use-action-request';
import { useCachedRequest } from '@/shared/hooks/use-cached-request';
import { useCallback } from 'react';
import { useSWRConfig } from 'swr';
import { notificationsApi } from '../api';

const PREFIX = 'notifications';
const UNREAD_POLL_MS = 30_000;

/** Refresh every notifications cache entry (list + unread badge) after a mutation. */
function useInvalidateNotifications() {
  const { mutate } = useSWRConfig();
  return useCallback(
    () => mutate((key) => typeof key === 'string' && key.startsWith(PREFIX)),
    [mutate],
  );
}

export function useNotifications(params: ListNotificationsRequest, opts?: { enabled?: boolean }) {
  const user = useAuthStore((s) => s.user);
  const enabled = (opts?.enabled ?? true) && !!user;

  return useCachedRequest<ListNotificationsResponse>({
    key: enabled ? `${PREFIX}?${JSON.stringify(params)}` : null,
    fetcher: () => notificationsApi.list(params),
  });
}

export function useUnreadCount() {
  const user = useAuthStore((s) => s.user);

  return useCachedRequest<GetUnreadCountResponse>({
    key: user ? `${PREFIX}/unread-count` : null,
    fetcher: () => notificationsApi.getUnreadCount(),
    config: { refreshInterval: UNREAD_POLL_MS },
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
