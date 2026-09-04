import { createDatabaseClient, notification, user, type DatabaseClient } from '@pkg/database';
import { describeIntegration, truncate } from '@pkg/testing';
import { afterAll, beforeEach, expect, it } from 'vitest';
import { NotificationRepository } from '@/queues/example/notification.repository.js';

/**
 * An integration test: it runs against a real Postgres when `DATABASE_URL` is
 * set and is skipped otherwise, so a fresh clone or an agent worktree still
 * passes `pnpm verify` with nothing running.
 *
 *   DATABASE_URL=postgresql://… pnpm --filter @pkg/worker test
 */
describeIntegration('NotificationRepository', () => {
  const client: DatabaseClient = createDatabaseClient({ url: process.env.DATABASE_URL! });
  const repository = new NotificationRepository(client);
  let userId: string;

  beforeEach(async () => {
    // notification references user, so children first.
    await truncate(client.db, [notification, user]);

    const [row] = await client.db
      .insert(user)
      .values({
        email: `notify-${Date.now()}@example.com`,
        name: 'Notify Test',
        passwordHash: 'x',
      })
      .returning();
    userId = row!.id;
  });

  afterAll(async () => {
    await truncate(client.db, [notification, user]);
    await client.close();
  });

  it('persists a notification and returns the stored row', async () => {
    const created = await repository.create({
      userId,
      type: 'success',
      channel: 'in_app',
      title: 'Task Completed',
      message: 'All done.',
      data: { taskId: 'job-1' },
    });

    expect(created.id).toBeTruthy();
    expect(created.title).toBe('Task Completed');
    // Defaults come from the database, not the caller.
    expect(created.read).toBe(false);
    expect(created.createdAt).toBeInstanceOf(Date);
  });

  it('round-trips the json data column', async () => {
    const created = await repository.create({
      userId,
      type: 'error',
      channel: 'in_app',
      title: 'Task Failed',
      message: 'SMTP unreachable',
      data: { taskId: 'job-2', durationMs: 120 },
    });

    expect(created.data).toEqual({ taskId: 'job-2', durationMs: 120 });
  });

  it('rejects a notification for a user that does not exist', async () => {
    await expect(
      repository.create({
        userId: '00000000-0000-0000-0000-000000000000',
        type: 'success',
        channel: 'in_app',
        title: 'Orphan',
      }),
    ).rejects.toThrow();
  });
});
