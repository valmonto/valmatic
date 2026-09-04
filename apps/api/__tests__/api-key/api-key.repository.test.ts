import {
  createDatabaseClient,
  apiKey,
  user,
  type DatabaseClient,
  organization,
  organizationUser,
} from '@pkg/database';
import { describeIntegration, truncate } from '@pkg/testing';
import { afterAll, beforeEach, expect, it } from 'vitest';
import { ApiKeyRepository } from '@/api-key/api-key.repository';

/**
 * touchLastUsed is fire-and-forget, but it must still HIT THE DATABASE. A
 * drizzle query builder is lazy — it runs only when awaited or `.then`'d — so
 * the previous `void builder` silently never executed and `last_used_at` stayed
 * null forever despite the key being used on every request. This proves the
 * write actually lands. The service test mocks the repository, so only a real
 * database catches this class of bug.
 */
describeIntegration('ApiKeyRepository — touchLastUsed persists (lazy-builder guard)', () => {
  const client: DatabaseClient = createDatabaseClient({ url: process.env.DATABASE_URL! });
  const repo = new ApiKeyRepository(client);
  let userId: string;

  beforeEach(async () => {
    await truncate(client.db, [apiKey, organizationUser, organization, user]);
    const [owner] = await client.db
      .insert(user)
      .values({ email: 'key-owner@example.com', name: 'key-owner', passwordHash: 'x' })
      .returning();
    userId = owner!.id;
  });

  afterAll(async () => {
    await truncate(client.db, [apiKey, organizationUser, organization, user]);
    await client.close();
  });

  it('actually writes last_used_at (a voided drizzle builder never runs)', async () => {
    const key = await repo.insert({
      name: 'claude-agent',
      prefix: 'sk_test',
      hashedKey: 'deadbeefdeadbeef',
      scopes: ['platform:read'],
      userId,
    });
    expect(key.lastUsedAt).toBeNull();

    // Awaitable BECAUSE the query is executed inside; the production caller
    // fires-and-forgets it with a .catch that logs (never blocks the request).
    await repo.touchLastUsed(key.id);

    const after = (await repo.listActive()).find((r) => r.id === key.id);
    expect(after?.lastUsedAt).not.toBeNull();
  });
});
