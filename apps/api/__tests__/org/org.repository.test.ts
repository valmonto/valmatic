import {
  createDatabaseClient,
  organization,
  organizationUser,
  user,
  type DatabaseClient,
} from '@pkg/database';
import { describeIntegration, truncate } from '@pkg/testing';
import { afterAll, beforeEach, expect, it } from 'vitest';
import { OrgRepository } from '@/org/org.repository';

/**
 * The service tests assert the repository is *called* with the right ids; only
 * a real database shows the joins actually scope by them — the lesson from the
 * user module, where exactly that gap hid a cross-tenant write.
 */
describeIntegration('OrgRepository', () => {
  const client: DatabaseClient = createDatabaseClient({ url: process.env.DATABASE_URL! });
  const repository = new OrgRepository(client);

  let orgA: string;
  let orgB: string;
  let ownerA: string;
  let ownerB: string;

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
    await truncate(client.db, [organizationUser, organization, user]);

    const a = await makeOrg('org-a');
    const b = await makeOrg('org-b');
    orgA = a.orgId;
    orgB = b.orgId;
    ownerA = a.ownerId;
    ownerB = b.ownerId;
  });

  afterAll(async () => {
    await truncate(client.db, [organizationUser, organization, user]);
    await client.close();
  });

  it('lists only the organizations the user belongs to', async () => {
    const orgs = await repository.findOrgsForUser(ownerA);

    expect(orgs.map((o) => o.id)).toEqual([orgA]);
  });

  // The lookup takes both ids; filtering by org alone would confirm the
  // existence of organizations the caller cannot see.
  it('returns null for a real organization the user is not a member of', async () => {
    await expect(repository.findOrgForUser(orgB, ownerA)).resolves.toBeNull();
  });

  it('reports the role held in that organization', async () => {
    await client.db
      .insert(organizationUser)
      .values({ orgId: orgB, userId: ownerA, role: 'MEMBER' });

    const org = await repository.findOrgForUser(orgB, ownerA);

    expect(org).toMatchObject({ id: orgB, role: 'MEMBER' });
  });

  it('returns the updated row from the write itself', async () => {
    const updated = await repository.updateOrg(orgA, { name: 'Renamed' });

    expect(updated).toMatchObject({ id: orgA, name: 'Renamed' });
    await expect(repository.findOrgForUser(orgA, ownerA)).resolves.toMatchObject({
      name: 'Renamed',
    });
  });

  it('returns the current row when there is nothing to update', async () => {
    const untouched = await repository.updateOrg(orgA, {});

    expect(untouched).toMatchObject({ id: orgA, name: 'org-a' });
  });

  it('updates only the organization addressed', async () => {
    await repository.updateOrg(orgA, { name: 'Renamed' });

    await expect(repository.findOrgForUser(orgB, ownerB)).resolves.toMatchObject({
      name: 'org-b',
    });
  });

  it('creates the organization with the creator as OWNER', async () => {
    const created = await repository.createOrg({ name: 'org-c', ownerId: ownerA });

    expect(created.role).toBe('OWNER');
    await expect(repository.findOrgForUser(created.id, ownerA)).resolves.toMatchObject({
      id: created.id,
      role: 'OWNER',
    });
  });

  it('deleting an organization removes its memberships but not its members', async () => {
    await client.db
      .insert(organizationUser)
      .values({ orgId: orgB, userId: ownerA, role: 'MEMBER' });

    await repository.deleteOrg(orgB);

    // Membership gone with the org…
    await expect(repository.countUserOrgs(ownerA)).resolves.toBe(1);
    // …but the account survives, still holding its other membership.
    await expect(repository.findOrgForUser(orgA, ownerA)).resolves.toMatchObject({ id: orgA });
  });

  it('counts memberships, not organizations owned', async () => {
    await client.db
      .insert(organizationUser)
      .values({ orgId: orgB, userId: ownerA, role: 'MEMBER' });

    await expect(repository.countUserOrgs(ownerA)).resolves.toBe(2);
  });

  it('resolves the role only within the organization asked about', async () => {
    await expect(repository.getUserRoleInOrg(ownerA, orgA)).resolves.toBe('OWNER');
    await expect(repository.getUserRoleInOrg(ownerA, orgB)).resolves.toBeNull();
  });

  // The admin view is the one query allowed to cross tenants: every
  // organization, whoever asks, with a real member count per row.
  it('lists every organization for the platform view, with member counts', async () => {
    await client.db
      .insert(organizationUser)
      .values({ orgId: orgA, userId: ownerB, role: 'MEMBER' });

    const { data, total } = await repository.findAllOrgs({ skip: 0, limit: 20 });

    expect(total).toBe(2);
    expect(data.find((o) => o.id === orgA)?.memberCount).toBe(2);
    expect(data.find((o) => o.id === orgB)?.memberCount).toBe(1);
  });

  it('finds an organization by id alone, without a membership', async () => {
    await expect(repository.findOrgById(orgB)).resolves.toMatchObject({ id: orgB });
    await expect(
      repository.findOrgById('00000000-0000-4000-8000-000000000000'),
    ).resolves.toBeNull();
  });
});
