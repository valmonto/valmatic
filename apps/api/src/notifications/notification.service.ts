import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type {
  ListNotificationsRequest,
  ListNotificationsResponse,
  GetNotificationByIdResponse,
  MarkNotificationReadResponse,
  MarkAllNotificationsReadResponse,
  GetUnreadCountResponse,
  ActiveUser,
} from '@pkg/contracts';
import type { NewNotification, NotificationType, NotificationChannel } from '@pkg/database';
import { k } from '@pkg/locales';
import { NotificationRepository } from './notification.repository';

export interface CreateNotificationData {
  userId: string;
  orgId?: string;
  type?: NotificationType;
  channel?: NotificationChannel;
  title: string;
  message?: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    @InjectPinoLogger(NotificationService.name) private readonly logger: PinoLogger,
  ) {}

  async create(data: CreateNotificationData): Promise<void> {
    const notificationData: NewNotification = {
      userId: data.userId,
      orgId: data.orgId,
      type: data.type ?? 'info',
      channel: data.channel ?? 'in_app',
      title: data.title,
      message: data.message,
      data: data.data,
    };

    await this.notificationRepository.create(notificationData);

    this.logger.info({ userId: data.userId, title: data.title }, 'Notification created');
  }

  async list(
    activeUser: ActiveUser,
    dto: ListNotificationsRequest,
  ): Promise<ListNotificationsResponse> {
    const { data, total } = await this.notificationRepository.findByUserId(activeUser.userId, {
      skip: dto.skip,
      limit: dto.limit,
      unreadOnly: dto.unreadOnly,
    });

    return {
      data: data.map((n) => ({
        ...n,
        readAt: n.readAt?.toISOString() ?? null,
        createdAt: n.createdAt.toISOString(),
      })),
      meta: {
        total,
        skip: dto.skip,
        limit: dto.limit,
      },
    };
  }

  async getById(activeUser: ActiveUser, id: string): Promise<GetNotificationByIdResponse> {
    const notification = await this.notificationRepository.findById(id, activeUser.userId);

    if (!notification) {
      throw new NotFoundException(k.notifications.errors.notFound);
    }

    return {
      ...notification,
      readAt: notification.readAt?.toISOString() ?? null,
      createdAt: notification.createdAt.toISOString(),
    };
  }

  async markAsRead(activeUser: ActiveUser, id: string): Promise<MarkNotificationReadResponse> {
    const notification = await this.notificationRepository.markAsRead(id, activeUser.userId);

    if (!notification) {
      throw new NotFoundException(k.notifications.errors.notFound);
    }

    this.logger.debug({ notificationId: id }, 'Notification marked as read');

    return {
      ...notification,
      readAt: notification.readAt?.toISOString() ?? null,
      createdAt: notification.createdAt.toISOString(),
    };
  }

  async markAllAsRead(activeUser: ActiveUser): Promise<MarkAllNotificationsReadResponse> {
    const count = await this.notificationRepository.markAllAsRead(activeUser.userId);

    this.logger.debug({ userId: activeUser.userId, count }, 'All notifications marked as read');

    return { count };
  }

  async getUnreadCount(activeUser: ActiveUser): Promise<GetUnreadCountResponse> {
    const count = await this.notificationRepository.getUnreadCount(activeUser.userId);
    return { count };
  }

  async delete(activeUser: ActiveUser, id: string): Promise<void> {
    const deleted = await this.notificationRepository.delete(id, activeUser.userId);

    if (!deleted) {
      throw new NotFoundException(k.notifications.errors.notFound);
    }

    this.logger.debug({ notificationId: id }, 'Notification deleted');
  }

  async deleteAll(activeUser: ActiveUser): Promise<{ count: number }> {
    const count = await this.notificationRepository.deleteAll(activeUser.userId);

    this.logger.debug({ userId: activeUser.userId, count }, 'All notifications deleted');

    return { count };
  }
}
