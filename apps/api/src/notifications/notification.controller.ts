import { Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { ActiveUser, Role, Roles } from '@pkg/server';
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

@Roles(Role.MEMBER, Role.OWNER, Role.ADMIN)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async list(
    @Query() query: ListNotificationsRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<ListNotificationsResponse> {
    const dto = ListNotificationsRequestSchema.parse(query);
    return this.notificationService.list(activeUser, dto);
  }

  @Get('unread-count')
  async getUnreadCount(@ActiveUser() activeUser: ActiveUserType): Promise<GetUnreadCountResponse> {
    return this.notificationService.getUnreadCount(activeUser);
  }

  @Get(':id')
  async getById(
    @Param('id') id: string,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<GetNotificationByIdResponse> {
    return this.notificationService.getById(activeUser, id);
  }

  @Patch('read-all')
  async markAllAsRead(
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<MarkAllNotificationsReadResponse> {
    return this.notificationService.markAllAsRead(activeUser);
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<MarkNotificationReadResponse> {
    return this.notificationService.markAsRead(activeUser, id);
  }

  @Delete()
  async deleteAll(
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<DeleteAllNotificationsResponse> {
    return this.notificationService.deleteAll(activeUser);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<DeleteNotificationResponse> {
    await this.notificationService.delete(activeUser, id);
    return {};
  }
}
