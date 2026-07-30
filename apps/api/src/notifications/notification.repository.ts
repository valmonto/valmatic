import { Inject, Injectable } from '@nestjs/common';
import {
  DATABASE_CLIENT,
  type DatabaseClient,
  notification,
  eq,
  and,
  or,
  isNull,
  count,
  desc,
  type NewNotification,
  type Notification,
} from '@pkg/database';

/**
 * A notification belongs to a user AND an organization context:
 *
 *  - `orgId` set   → produced inside that organization; visible only while the
 *                    user is switched into it
 *  - `orgId` NULL  → a platform notice for the account; visible everywhere
 *
 * Every read and write below carries the same predicate,
 * `userId = ? AND (orgId = ? OR orgId IS NULL)` — filtering by user alone let
 * notifications follow the user across organizations, and let "delete all"
 * issued in one organization erase another's.
 */
@Injectable()
export class NotificationRepository {
  constructor(@Inject(DATABASE_CLIENT) private readonly dbClient: DatabaseClient) {}

  private visibleTo(userId: string, orgId: string) {
    return and(
      eq(notification.userId, userId),
      or(eq(notification.orgId, orgId), isNull(notification.orgId)),
    );
  }

  async create(data: NewNotification): Promise<Notification> {
    const [result] = await this.dbClient.db.insert(notification).values(data).returning();
    return result!;
  }

  async findForUser(
    userId: string,
    orgId: string,
    opts: { skip: number; limit: number; unreadOnly?: boolean },
  ): Promise<{ data: Notification[]; total: number }> {
    const { skip, limit, unreadOnly } = opts;

    const conditions = [this.visibleTo(userId, orgId)];
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

  async findById(id: string, userId: string, orgId: string): Promise<Notification | null> {
    const [result] = await this.dbClient.db
      .select()
      .from(notification)
      .where(and(eq(notification.id, id), this.visibleTo(userId, orgId)))
      .limit(1);

    return result ?? null;
  }

  async markAsRead(id: string, userId: string, orgId: string): Promise<Notification | null> {
    const [result] = await this.dbClient.db
      .update(notification)
      .set({ read: true, readAt: new Date() })
      .where(and(eq(notification.id, id), this.visibleTo(userId, orgId)))
      .returning();

    return result ?? null;
  }

  // "All" means everything the list shows in this organization — org-scoped
  // rows plus platform notices — and nothing more. A broader write would mark
  // notifications the user has never seen.
  async markAllAsRead(userId: string, orgId: string): Promise<number> {
    const result = await this.dbClient.db
      .update(notification)
      .set({ read: true, readAt: new Date() })
      .where(and(this.visibleTo(userId, orgId), eq(notification.read, false)))
      .returning({ id: notification.id });

    return result.length;
  }

  async getUnreadCount(userId: string, orgId: string): Promise<number> {
    const [result] = await this.dbClient.db
      .select({ count: count() })
      .from(notification)
      .where(and(this.visibleTo(userId, orgId), eq(notification.read, false)));

    return result?.count ?? 0;
  }

  async delete(id: string, userId: string, orgId: string): Promise<boolean> {
    const result = await this.dbClient.db
      .delete(notification)
      .where(and(eq(notification.id, id), this.visibleTo(userId, orgId)))
      .returning({ id: notification.id });

    return result.length > 0;
  }

  async deleteAll(userId: string, orgId: string): Promise<number> {
    const result = await this.dbClient.db
      .delete(notification)
      .where(this.visibleTo(userId, orgId))
      .returning({ id: notification.id });

    return result.length;
  }
}
