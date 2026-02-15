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
import type { HttpClient } from '../http';

export const notificationsResource = (http: HttpClient) => ({
  list: (dto: ListNotificationsRequest): Promise<ListNotificationsResponse> =>
    http.get('/api/notifications', { params: dto }),

  getById: (id: string): Promise<GetNotificationByIdResponse> =>
    http.get(`/api/notifications/${id}`),

  markAsRead: (id: string): Promise<MarkNotificationReadResponse> =>
    http.patch(`/api/notifications/${id}/read`),

  markAllAsRead: (): Promise<MarkAllNotificationsReadResponse> =>
    http.patch('/api/notifications/read-all'),

  getUnreadCount: (): Promise<GetUnreadCountResponse> =>
    http.get('/api/notifications/unread-count'),

  delete: (id: string): Promise<DeleteNotificationResponse> =>
    http.delete(`/api/notifications/${id}`),

  deleteAll: (): Promise<DeleteAllNotificationsResponse> =>
    http.delete('/api/notifications'),
});
