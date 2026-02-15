import { Inject, Injectable } from '@nestjs/common';
import {
  DATABASE_CLIENT,
  type DatabaseClient,
  notification,
  eq,
  and,
  count,
  desc,
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

  async findByUserId(
    userId: string,
    opts: { skip: number; limit: number; unreadOnly?: boolean },
  ): Promise<{ data: Notification[]; total: number }> {
    const { skip, limit, unreadOnly } = opts;

    const conditions = [eq(notification.userId, userId)];
    if (unreadOnly) {
      conditions.push(eq(notification.read, false));
    }

    const whereClause = and(...conditions);

    const [data, totalResult] = await Promise.all([
      this.dbClient.db
        .select()
        .from(notification)
        .where(whereClause)
        .orderBy(desc(notification.createdAt))
        .offset(skip)
        .limit(limit),
      this.dbClient.db.select({ count: count() }).from(notification).where(whereClause),
    ]);

    return {
      data,
      total: totalResult[0]?.count ?? 0,
    };
  }

  async findById(id: string, userId: string): Promise<Notification | null> {
    const [result] = await this.dbClient.db
      .select()
      .from(notification)
      .where(and(eq(notification.id, id), eq(notification.userId, userId)))
      .limit(1);

    return result ?? null;
  }

  async markAsRead(id: string, userId: string): Promise<Notification | null> {
    const [result] = await this.dbClient.db
      .update(notification)
      .set({ read: true, readAt: new Date() })
      .where(and(eq(notification.id, id), eq(notification.userId, userId)))
      .returning();

    return result ?? null;
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.dbClient.db
      .update(notification)
      .set({ read: true, readAt: new Date() })
      .where(and(eq(notification.userId, userId), eq(notification.read, false)))
      .returning({ id: notification.id });

    return result.length;
  }

  async getUnreadCount(userId: string): Promise<number> {
    const [result] = await this.dbClient.db
      .select({ count: count() })
      .from(notification)
      .where(and(eq(notification.userId, userId), eq(notification.read, false)));

    return result?.count ?? 0;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await this.dbClient.db
      .delete(notification)
      .where(and(eq(notification.id, id), eq(notification.userId, userId)))
      .returning({ id: notification.id });

    return result.length > 0;
  }

  async deleteAll(userId: string): Promise<number> {
    const result = await this.dbClient.db
      .delete(notification)
      .where(eq(notification.userId, userId))
      .returning({ id: notification.id });

    return result.length;
  }
}
