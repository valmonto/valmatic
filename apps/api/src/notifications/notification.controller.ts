import { Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { ActiveUser, Permissions } from '@pkg/server';
import {
  ListNotificationsRequestSchema,
  type ListNotificationsRequest,
  type ListNotificationsResponse,
  type GetNotificationByIdResponse,
  type MarkNotificationReadResponse,
  type MarkAllNotificationsReadResponse,
  type GetUnreadCountResponse,
  type DeleteNotificationResponse,
  type DeleteAllNotificationsResponse,
  type ActiveUser as ActiveUserType,
} from '@pkg/contracts';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @Permissions('notification:list')
  async list(
    @Query() query: ListNotificationsRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<ListNotificationsResponse> {
    const dto = ListNotificationsRequestSchema.parse(query);
    return this.notificationService.list(activeUser, dto);
  }

  @Get('unread-count')
  @Permissions('notification:list')
  async getUnreadCount(@ActiveUser() activeUser: ActiveUserType): Promise<GetUnreadCountResponse> {
    return this.notificationService.getUnreadCount(activeUser);
  }

  @Get(':id')
  @Permissions('notification:read')
  async getById(
    @Param('id') id: string,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<GetNotificationByIdResponse> {
    return this.notificationService.getById(activeUser, id);
  }

  @Patch('read-all')
  @Permissions('notification:update')
  async markAllAsRead(
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<MarkAllNotificationsReadResponse> {
    return this.notificationService.markAllAsRead(activeUser);
  }

  @Patch(':id/read')
  @Permissions('notification:update')
  async markAsRead(
    @Param('id') id: string,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<MarkNotificationReadResponse> {
    return this.notificationService.markAsRead(activeUser, id);
  }

  @Delete()
  @Permissions('notification:delete')
  async deleteAll(
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<DeleteAllNotificationsResponse> {
    return this.notificationService.deleteAll(activeUser);
  }

  @Delete(':id')
  @Permissions('notification:delete')
  async delete(
    @Param('id') id: string,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<DeleteNotificationResponse> {
    await this.notificationService.delete(activeUser, id);
    return {};
  }
}
