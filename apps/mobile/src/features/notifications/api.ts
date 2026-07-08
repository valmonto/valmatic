import type {
  DeleteAllNotificationsResponse,
  DeleteNotificationResponse,
  GetNotificationByIdResponse,
  GetUnreadCountResponse,
  ListNotificationsRequest,
  ListNotificationsResponse,
  MarkAllNotificationsReadResponse,
  MarkNotificationReadResponse,
} from '@pkg/contracts';
import { api, type Api } from '@/shared/api/http';

/**
 * Typed resource over the API — the mobile twin of the web feature's `api.ts`.
 * Paths are relative to the `/api` prefix baked into the client's baseURL.
 * Prefer the feature hooks (`hooks/use-notifications.ts`) over this directly.
 */
export const notificationsResource = (client: Api) => ({
  list: (dto: ListNotificationsRequest): Promise<ListNotificationsResponse> =>
    client.get('/notifications', { params: dto }),

  getById: (id: string): Promise<GetNotificationByIdResponse> =>
    client.get(`/notifications/${id}`),

  markAsRead: (id: string): Promise<MarkNotificationReadResponse> =>
    client.patch(`/notifications/${id}/read`),

  markAllAsRead: (): Promise<MarkAllNotificationsReadResponse> =>
    client.patch('/notifications/read-all'),

  getUnreadCount: (): Promise<GetUnreadCountResponse> =>
    client.get('/notifications/unread-count'),

  delete: (id: string): Promise<DeleteNotificationResponse> =>
    client.delete(`/notifications/${id}`),

  deleteAll: (): Promise<DeleteAllNotificationsResponse> =>
    client.delete('/notifications'),
});

export const notificationsApi = notificationsResource(api);
