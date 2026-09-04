import { Controller, Delete, Get, Patch } from '@nestjs/common';
import { ActiveUser, Permissions, ZodRequest } from '@pkg/server';
import {
  type DeleteAllNotificationsRequest,
  DeleteAllNotificationsRequestSchema,
  DeleteAllNotificationsResponse,
  type DeleteNotificationRequest,
  DeleteNotificationRequestSchema,
  DeleteNotificationResponse,
  type GetNotificationByIdRequest,
  GetNotificationByIdRequestSchema,
  GetNotificationByIdResponse,
  type GetUnreadCountRequest,
  GetUnreadCountRequestSchema,
  GetUnreadCountResponse,
  type ListNotificationsRequest,
  ListNotificationsRequestSchema,
  ListNotificationsResponse,
  type MarkAllNotificationsReadRequest,
  MarkAllNotificationsReadRequestSchema,
  MarkAllNotificationsReadResponse,
  type MarkNotificationReadRequest,
  MarkNotificationReadRequestSchema,
  MarkNotificationReadResponse,
  type ActiveUser as ActiveUserType,
} from '@pkg/contracts';
import { NotificationService } from './notification.service.js';

/**
 * Every route takes its input through `@ZodRequest`. The static routes
 * (`unread-count`, `read-all`) are declared before `:id`, and that order is
 * load-bearing — Nest matches top to bottom, so reversed they would arrive
 * here as `id: 'unread-count'` and 400 on the uuid check.
 */
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @Permissions('notification:list')
  async list(
    @ZodRequest(ListNotificationsRequestSchema) dto: ListNotificationsRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<ListNotificationsResponse> {
    return this.notificationService.list(activeUser, dto);
  }

  @Get('unread-count')
  @Permissions('notification:list')
  async getUnreadCount(
    @ZodRequest(GetUnreadCountRequestSchema) dto: GetUnreadCountRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<GetUnreadCountResponse> {
    return this.notificationService.getUnreadCount(activeUser);
  }

  @Get(':id')
  @Permissions('notification:read')
  async getById(
    @ZodRequest(GetNotificationByIdRequestSchema) dto: GetNotificationByIdRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<GetNotificationByIdResponse> {
    return this.notificationService.getById(activeUser, dto.id);
  }

  @Patch('read-all')
  @Permissions('notification:update')
  async markAllAsRead(
    @ZodRequest(MarkAllNotificationsReadRequestSchema) dto: MarkAllNotificationsReadRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<MarkAllNotificationsReadResponse> {
    return this.notificationService.markAllAsRead(activeUser);
  }

  @Patch(':id/read')
  @Permissions('notification:update')
  async markAsRead(
    @ZodRequest(MarkNotificationReadRequestSchema) dto: MarkNotificationReadRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<MarkNotificationReadResponse> {
    return this.notificationService.markAsRead(activeUser, dto.id);
  }

  @Delete()
  @Permissions('notification:delete')
  async deleteAll(
    @ZodRequest(DeleteAllNotificationsRequestSchema) dto: DeleteAllNotificationsRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<DeleteAllNotificationsResponse> {
    return this.notificationService.deleteAll(activeUser);
  }

  @Delete(':id')
  @Permissions('notification:delete')
  async delete(
    @ZodRequest(DeleteNotificationRequestSchema) dto: DeleteNotificationRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<DeleteNotificationResponse> {
    await this.notificationService.delete(activeUser, dto.id);
    return {};
  }
}
