import {
  createDatabaseClient,
  organization,
  organizationUser,
  user,
  type DatabaseClient,
} from '@pkg/database';
import { describeIntegration, truncate } from '@pkg/testing';
import { afterAll, beforeEach, expect, it } from 'vitest';
import { UserRepository } from '@/user/user.repository.js';

/**
 * The service tests assert the repository is *called* with an organization.
 * Only a real database can show the query actually *filters* by one — which is
 * the join standing between two tenants, and the thing a fake cannot prove.
 *
 * Runs when DATABASE_URL is set and skips otherwise, so `pnpm verify` passes on
 * a machine with nothing running.
 */
describeIntegration('UserRepository', () => {
  const client: DatabaseClient = createDatabaseClient({ url: process.env.DATABASE_URL! });
  const repository = new UserRepository(client);

  let orgA: string;
  let orgB: string;
  let ownerA: string;

  async function makeOrg(name: string): Promise<{ orgId: string; ownerId: string }> {
    const [owner] = await client.db
      .insert(user)
      .values({ email: `${name}-owner@example.com`, name: `${name} owner`, passwordHash: 'x' })
      .returning();

    const [org] = await client.db
      .insert(organization)
      .values({ name, ownerId: owner!.id })
      .returning();

    await client.db
      .insert(organizationUser)
      .values({ orgId: org!.id, userId: owner!.id, role: 'OWNER' });

    return { orgId: org!.id, ownerId: owner!.id };
  }

  beforeEach(async () => {
    // Children first: organizationUser references both sides.
    await truncate(client.db, [organizationUser, organization, user]);

    const a = await makeOrg('org-a');
    const b = await makeOrg('org-b');
    orgA = a.orgId;
    orgB = b.orgId;
    ownerA = a.ownerId;
  });

  afterAll(async () => {
    await truncate(client.db, [organizationUser, organization, user]);
    await client.close();
  });

  it('lists only members of the organization asked for', async () => {
    const { data, total } = await repository.findUsersInOrg(orgA, { skip: 0, limit: 20 });

    expect(total).toBe(1);
    expect(data.map((u) => u.id)).toEqual([ownerA]);
  });

  it('does not return a member of another organization', async () => {
    const { data } = await repository.findUsersInOrg(orgB, { skip: 0, limit: 20 });

    expect(data.map((u) => u.id)).not.toContain(ownerA);
  });

  it('finds a user inside their own organization', async () => {
    await expect(repository.findUserInOrg(ownerA, orgA)).resolves.toMatchObject({ id: ownerA });
  });

  // The lookup takes both ids; filtering by user alone would return a
  // membership belonging to a tenant the caller cannot see.
  it('returns null for a real user in an organization they do not belong to', async () => {
    await expect(repository.findUserInOrg(ownerA, orgB)).resolves.toBeNull();
  });

  it('creates the user and the membership together', async () => {
    const created = await repository.createUserWithOrgMembership({
      email: 'new@example.com',
      name: 'New',
      passwordHash: 'x',
      orgId: orgA,
      role: 'MEMBER',
    });

    expect(created.role).toBe('MEMBER');
    await expect(repository.findUserInOrg(created.id, orgA)).resolves.toMatchObject({
      id: created.id,
    });
  });

  // Both writes share a transaction, so a failure must leave no orphaned user
  // for an email that then cannot be registered again.
  it('leaves no user behind when the membership cannot be written', async () => {
    await expect(
      repository.createUserWithOrgMembership({
        email: 'orphan@example.com',
        name: 'Orphan',
        passwordHash: 'x',
        orgId: '00000000-0000-0000-0000-000000000000',
        role: 'MEMBER',
      }),
    ).rejects.toThrow();

    await expect(repository.findUserByEmail('orphan@example.com')).resolves.toBeNull();
  });

  it('counts memberships rather than users', async () => {
    const created = await repository.createUserWithOrgMembership({
      email: 'multi@example.com',
      name: 'Multi',
      passwordHash: 'x',
      orgId: orgA,
      role: 'MEMBER',
    });
    await client.db
      .insert(organizationUser)
      .values({ orgId: orgB, userId: created.id, role: 'MEMBER' });

    await expect(repository.countUserOrgs(created.id)).resolves.toBe(2);
  });

  // Removal drops one membership. The account is shared, so deleting it here
  // would remove the person from an organization this caller cannot see.
  it('removes one membership and leaves the account', async () => {
    const created = await repository.createUserWithOrgMembership({
      email: 'shared@example.com',
      name: 'Shared',
      passwordHash: 'x',
      orgId: orgA,
      role: 'MEMBER',
    });
    await client.db
      .insert(organizationUser)
      .values({ orgId: orgB, userId: created.id, role: 'MEMBER' });

    await repository.removeUserFromOrg(created.id, orgA);

    await expect(repository.findUserInOrg(created.id, orgA)).resolves.toBeNull();
    await expect(repository.findUserInOrg(created.id, orgB)).resolves.toMatchObject({
      id: created.id,
    });
    await expect(repository.countUserOrgs(created.id)).resolves.toBe(1);
  });

  it('updates only within the organization given', async () => {
    const created = await repository.createUserWithOrgMembership({
      email: 'target@example.com',
      name: 'Target',
      passwordHash: 'x',
      orgId: orgA,
      role: 'MEMBER',
    });

    await expect(repository.updateUser(created.id, orgB, { name: 'Renamed' })).resolves.toBeNull();
    await expect(repository.findUserInOrg(created.id, orgA)).resolves.toMatchObject({
      name: 'Target',
    });
  });
});
