import { z } from 'zod';
import { PaginatedRequestSchema, PaginatedResponseSchema } from './pagination.schema';

// --- Notification Enums ---
export const NotificationTypeSchema = z.enum(['info', 'success', 'warning', 'error']);
export const NotificationChannelSchema = z.enum(['in_app', 'email', 'push']);

export type NotificationType = z.infer<typeof NotificationTypeSchema>;
export type NotificationChannel = z.infer<typeof NotificationChannelSchema>;

// --- Notification Entity ---
export const NotificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  orgId: z.string().uuid().nullable(),
  type: NotificationTypeSchema,
  channel: NotificationChannelSchema,
  title: z.string(),
  message: z.string().nullable(),
  link: z.string().nullable(),
  data: z.record(z.string(), z.unknown()).nullable(),
  read: z.boolean(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
});

export type Notification = z.infer<typeof NotificationSchema>;

// --- List Notifications ---
export const ListNotificationsRequestSchema = PaginatedRequestSchema.extend({
  unreadOnly: z
    .preprocess((val) => val === 'true' || val === true, z.boolean())
    .optional()
    .default(false),
}).strict();

export const ListNotificationsResponseSchema = PaginatedResponseSchema(NotificationSchema);

export type ListNotificationsRequest = z.infer<typeof ListNotificationsRequestSchema>;
export type ListNotificationsResponse = z.infer<typeof ListNotificationsResponseSchema>;

// --- Get Notification by ID ---
export const GetNotificationByIdRequestSchema = z.object({ id: z.string().uuid() }).strict();
export const GetNotificationByIdResponseSchema = NotificationSchema;

export type GetNotificationByIdRequest = z.infer<typeof GetNotificationByIdRequestSchema>;
export type GetNotificationByIdResponse = z.infer<typeof GetNotificationByIdResponseSchema>;

// --- Mark Notification as Read ---
export const MarkNotificationReadRequestSchema = z.object({ id: z.string().uuid() }).strict();
export const MarkNotificationReadResponseSchema = NotificationSchema;

export type MarkNotificationReadRequest = z.infer<typeof MarkNotificationReadRequestSchema>;
export type MarkNotificationReadResponse = z.infer<typeof MarkNotificationReadResponseSchema>;

// --- Mark All Notifications as Read ---
export const MarkAllNotificationsReadResponseSchema = z.object({
  count: z.number().int(),
});

export type MarkAllNotificationsReadResponse = z.infer<typeof MarkAllNotificationsReadResponseSchema>;

// --- Get Unread Count ---
export const GetUnreadCountResponseSchema = z.object({
  count: z.number().int(),
});

export type GetUnreadCountResponse = z.infer<typeof GetUnreadCountResponseSchema>;

// --- Delete Notification ---
export const DeleteNotificationRequestSchema = z.object({ id: z.string().uuid() }).strict();
export const DeleteNotificationResponseSchema = z.object({});

export type DeleteNotificationRequest = z.infer<typeof DeleteNotificationRequestSchema>;
export type DeleteNotificationResponse = z.infer<typeof DeleteNotificationResponseSchema>;

// --- Delete All Notifications ---
export const DeleteAllNotificationsResponseSchema = z.object({
  count: z.number().int(),
});

export type DeleteAllNotificationsResponse = z.infer<typeof DeleteAllNotificationsResponseSchema>;
