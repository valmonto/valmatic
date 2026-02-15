import { Inject, Injectable } from '@nestjs/common';
import {
  DATABASE_CLIENT,
  type DatabaseClient,
  notification,
  type NewNotification,
  type Notification,
} from '@pkg/database';

@Injectable()
export class NotificationRepository {
  constructor(@Inject(DATABASE_CLIENT) private readonly dbClient: DatabaseClient) {}

  async create(data: NewNotification): Promise<Notification> {
    const [result] = await this.dbClient.db.insert(notification).values(data).returning();
    return result!;
  }
}
