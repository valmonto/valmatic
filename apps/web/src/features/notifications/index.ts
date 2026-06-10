/**
 * Public surface of the notifications feature. Other layers import from here
 * (`@/features/notifications`) and never reach into internal files directly.
 */
export { notificationsRoutes } from './routes';
export { notificationsResource } from './api';
export { NotificationBell } from './components/notification-bell';
export {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useDeleteAllNotifications,
} from './hooks/use-notifications';
