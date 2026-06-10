import type {
  ListNotificationsRequest,
  ListNotificationsResponse,
  GetNotificationByIdResponse,
  MarkNotificationReadResponse,
  MarkAllNotificationsReadResponse,
  GetUnreadCountResponse,
  DeleteNotificationResponse,
  DeleteAllNotificationsResponse,
} from '@pkg/contracts';
import { http, type HttpClient } from '@/shared/api/http';

/**
 * Factory kept exported so the global `api` aggregator can compose it.
 * Prefer the feature-local hooks (`use-notifications.ts`) over reaching here.
 */
export const notificationsResource = (client: HttpClient) => ({
  list: (dto: ListNotificationsRequest): Promise<ListNotificationsResponse> =>
    client.get('/api/notifications', { params: dto }),

  getById: (id: string): Promise<GetNotificationByIdResponse> =>
    client.get(`/api/notifications/${id}`),

  markAsRead: (id: string): Promise<MarkNotificationReadResponse> =>
    client.patch(`/api/notifications/${id}/read`),

  markAllAsRead: (): Promise<MarkAllNotificationsReadResponse> =>
    client.patch('/api/notifications/read-all'),

  getUnreadCount: (): Promise<GetUnreadCountResponse> =>
    client.get('/api/notifications/unread-count'),

  delete: (id: string): Promise<DeleteNotificationResponse> =>
    client.delete(`/api/notifications/${id}`),

  deleteAll: (): Promise<DeleteAllNotificationsResponse> => client.delete('/api/notifications'),
});

/** Bound instance the feature uses internally. */
export const notificationsApi = notificationsResource(http);
