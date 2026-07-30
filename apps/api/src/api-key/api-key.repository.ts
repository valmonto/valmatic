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

  touchLastUsed(id: string): void {
    // Fire-and-forget: a failed timestamp must never fail the request.
    void this.dbClient.db.update(apiKey).set({ lastUsedAt: new Date() }).where(eq(apiKey.id, id));
  }
}
