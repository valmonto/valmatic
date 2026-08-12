import { Inject, Injectable } from '@nestjs/common';
import {
  DATABASE_CLIENT,
  type DatabaseClient,
  apiKey,
  type ApiKeyRow,
  and,
  desc,
  eq,
  isNull,
} from '@pkg/database';

/**
 * Platform-level table on purpose — keys are minted by platform admins and are
 * not tenant data, so queries take no orgId (the documented exception class).
 */
@Injectable()
export class ApiKeyRepository {
  constructor(@Inject(DATABASE_CLIENT) private readonly dbClient: DatabaseClient) {}

  async insert(row: {
    name: string;
    prefix: string;
    hashedKey: string;
    scopes: string[];
    userId: string;
  }): Promise<ApiKeyRow> {
    const [created] = await this.dbClient.db.insert(apiKey).values(row).returning();
    return created!;
  }

  async listActive(): Promise<ApiKeyRow[]> {
    return this.dbClient.db
      .select()
      .from(apiKey)
      .where(isNull(apiKey.revokedAt))
      .orderBy(desc(apiKey.createdAt));
  }

  async findActiveByHash(hashedKey: string): Promise<ApiKeyRow | null> {
    const [row] = await this.dbClient.db
      .select()
      .from(apiKey)
      .where(and(eq(apiKey.hashedKey, hashedKey), isNull(apiKey.revokedAt)))
      .limit(1);
    return row ?? null;
  }

  async revoke(id: string): Promise<boolean> {
    const result = await this.dbClient.db
      .update(apiKey)
      .set({ revokedAt: new Date() })
      .where(and(eq(apiKey.id, id), isNull(apiKey.revokedAt)))
      .returning({ id: apiKey.id });
    return result.length > 0;
  }

  /**
   * Stamp last-used. Returns a real, executing promise: a drizzle builder is
   * lazy and only touches the database when awaited or `.then`'d — a bare
   * `void builder` evaluates the object and silently never runs (which left
   * `last_used_at` null forever despite constant use). `.then(() => undefined)`
   * forces execution and normalizes the result to void while letting a rejection
   * propagate — the fire-and-forget policy and its logging live at the caller,
   * so a failure here is observable rather than swallowed in silence (silence is
   * exactly what hid the original no-op).
   */
  touchLastUsed(id: string): Promise<void> {
    return this.dbClient.db
      .update(apiKey)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKey.id, id))
      .then(() => undefined);
  }
}
