import {
  createDatabaseClient,
  notification,
  organization,
  organizationUser,
  user,
  type DatabaseClient,
} from '@pkg/database';
import { describeIntegration, truncate } from '@pkg/testing';
import { afterAll, beforeEach, expect, it } from 'vitest';
import { NotificationRepository } from '@/notifications/notification.repository.js';

/**
 * The predicate under test is `userId AND (orgId = active OR orgId IS NULL)`.
 * Before it existed, notifications followed the user across organizations, and
 * "delete all" issued in one organization erased another's — only a real
 * database can prove the boundary holds now.
 */
describeIntegration('NotificationRepository', () => {
  const client: DatabaseClient = createDatabaseClient({ url: process.env.DATABASE_URL! });
  const repository = new NotificationRepository(client);

  let userId: string;
  let orgA: string;
  let orgB: string;

  beforeEach(async () => {
    await truncate(client.db, [notification, organizationUser, organization, user]);

    const [u] = await client.db
      .insert(user)
      .values({ email: 'member@example.com', name: 'Member', passwordHash: 'x' })
      .returning();
    userId = u!.id;

    const orgs = await client.db
      .insert(organization)
      .values([
        { name: 'org-a', ownerId: userId },
        { name: 'org-b', ownerId: userId },
      ])
      .returning();
    orgA = orgs[0]!.id;
    orgB = orgs[1]!.id;

    await client.db.insert(organizationUser).values([
      { orgId: orgA, userId, role: 'OWNER' },
      { orgId: orgB, userId, role: 'OWNER' },
    ]);

    // One notification in each context the predicate distinguishes.
    await client.db.insert(notification).values([
      { userId, orgId: orgA, title: 'in org A' },
      { userId, orgId: orgB, title: 'in org B' },
      { userId, orgId: null, title: 'platform notice' },
    ]);
  });

  afterAll(async () => {
    await truncate(client.db, [notification, organizationUser, organization, user]);
    await client.close();
  });

  async function titlesIn(orgId: string): Promise<string[]> {
    const { data } = await repository.findForUser(userId, orgId, { skip: 0, limit: 20 });
    return data.map((n) => n.title).sort();
  }

  it('shows an organization its own notifications plus platform notices', async () => {
    await expect(titlesIn(orgA)).resolves.toEqual(['in org A', 'platform notice']);
    await expect(titlesIn(orgB)).resolves.toEqual(['in org B', 'platform notice']);
  });

  it('counts unread within the same boundary as the list', async () => {
    await expect(repository.getUnreadCount(userId, orgA)).resolves.toBe(2);
  });

  it('does not resolve another organization notification by id', async () => {
    const { data } = await repository.findForUser(userId, orgB, { skip: 0, limit: 20 });
    const idInB = data.find((n) => n.title === 'in org B')!.id;

    await expect(repository.findById(idInB, userId, orgA)).resolves.toBeNull();
    await expect(repository.findById(idInB, userId, orgB)).resolves.toMatchObject({
      title: 'in org B',
    });
  });

  // The original defect: "all" ran account-wide, so acting in one organization
  // rewrote another's state.
  it('marks all as read in the active organization without touching the other', async () => {
    const count = await repository.markAllAsRead(userId, orgA);

    expect(count).toBe(2); // org A + the platform notice
    await expect(repository.getUnreadCount(userId, orgB)).resolves.toBe(1); // org B untouched
  });

  it('deletes all in the active organization without touching the other', async () => {
    const count = await repository.deleteAll(userId, orgA);

    expect(count).toBe(2);
    await expect(titlesIn(orgB)).resolves.toEqual(['in org B']);
  });

  it('refuses a single delete aimed across the boundary', async () => {
    const { data } = await repository.findForUser(userId, orgA, { skip: 0, limit: 20 });
    const idInA = data.find((n) => n.title === 'in org A')!.id;

    await expect(repository.delete(idInA, userId, orgB)).resolves.toBe(false);
    await expect(titlesIn(orgA)).resolves.toContain('in org A');
  });

  it('refuses to mark across the boundary', async () => {
    const { data } = await repository.findForUser(userId, orgA, { skip: 0, limit: 20 });
    const idInA = data.find((n) => n.title === 'in org A')!.id;

    await expect(repository.markAsRead(idInA, userId, orgB)).resolves.toBeNull();
    await expect(repository.getUnreadCount(userId, orgA)).resolves.toBe(2);
  });

  it('scopes by user as well as organization', async () => {
    const [other] = await client.db
      .insert(user)
      .values({ email: 'other@example.com', name: 'Other', passwordHash: 'x' })
      .returning();

    await expect(
      repository.findForUser(other!.id, orgA, { skip: 0, limit: 20 }),
    ).resolves.toMatchObject({ total: 0 });
  });
});
