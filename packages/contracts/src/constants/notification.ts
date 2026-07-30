/**
 * Notification value sets — the single source, used by the Zod schemas here
 * and the varchar CHECK constraints in @pkg/database. Zod-free: ships in
 * frontend bundles.
 *
 * Only the value arrays live here; the NotificationType/NotificationChannel
 * TYPES are inferred by the schemas (and re-exported through types/), so
 * exporting them here too would collide in the client entry.
 */
export const NOTIFICATION_TYPES = ['info', 'success', 'warning', 'error'] as const;

export const NOTIFICATION_CHANNELS = ['in_app', 'email', 'push'] as const;
