import { createHash } from 'node:crypto';
import {
  ConflictException,
  ForbiddenException,
  GoneException,
  NotFoundException,
} from '@nestjs/common';
import {
  createDatabaseClient,
  invitation,
  organization,
  organizationUser,
  user,
  eq,
  and,
  type DatabaseClient,
} from '@pkg/database';
import type { ActiveUser } from '@pkg/contracts';
import { describeIntegration, truncate, FakeLogger } from '@pkg/testing';
import type { IamService } from '@pkg/server';
import type { ConfigService } from '@nestjs/config';
import type { PinoLogger } from 'nestjs-pino';
import { afterAll, beforeEach, expect, it, vi } from 'vitest';
import { InvitationRepository } from '@/invitations/invitation.repository';
import { InvitationService } from '@/invitations/invitation.service';
import { UserRepository } from '@/user/user.repository';
import type { NotificationService } from '@/notifications/notification.service';

/**
 * Invitations are an IAM boundary: a link bound to org A must never mint a
 * membership in org B, a forwarded link must not let the wrong account in, and
 * a spent/revoked/expired link must reject. These only hold against real SQL —
 * the org scope lives in the WHERE clause.
 */
describeIntegration('InvitationService', () => {
  const client: DatabaseClient = createDatabaseClient({ url: process.env.DATABASE_URL! });
  const invitationRepo = new InvitationRepository(client);
  const userRepo = new UserRepository(client);

  const notifications = { create: vi.fn().mockResolvedValue(undefined) };
  const issueTokens = vi.fn().mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
  const iam = { auth: { issueTokens } } as unknown as IamService;
  const config = {
    get: (_k: string, d?: unknown) => d ?? 'http://localhost:5173',
  } as unknown as ConfigService;

  const service = new InvitationService(
    invitationRepo,
    userRepo,
    notifications as unknown as NotificationService,
    iam,
    config,
    new FakeLogger().as<PinoLogger>(),
  );

  let ownerA: string;
  let ownerB: string;
  let orgA: string;
  let orgB: string;

  const activeOwnerA = (): ActiveUser => ({
    userId: ownerA,
    orgId: orgA,
    orgRole: 'OWNER',
    systemRole: 'USER',
  });
  const activeOwnerB = (): ActiveUser => ({
    userId: ownerB,
    orgId: orgB,
    orgRole: 'OWNER',
    systemRole: 'USER',
  });

  beforeEach(async () => {
    notifications.create.mockClear();
    issueTokens.mockClear();
    await truncate(client.db, [invitation, organizationUser, organization, user]);

    const [ua, ub] = await client.db
      .insert(user)
      .values([
        { email: 'owner-a@example.com', name: 'Owner A', passwordHash: 'x' },
        { email: 'owner-b@example.com', name: 'Owner B', passwordHash: 'x' },
      ])
      .returning();
    ownerA = ua!.id;
    ownerB = ub!.id;

    const [oa, ob] = await client.db
      .insert(organization)
      .values([
        { name: 'Org A', ownerId: ownerA },
        { name: 'Org B', ownerId: ownerB },
      ])
      .returning();
    orgA = oa!.id;
    orgB = ob!.id;

    await client.db.insert(organizationUser).values([
      { orgId: orgA, userId: ownerA, role: 'OWNER' },
      { orgId: orgB, userId: ownerB, role: 'OWNER' },
    ]);
  });

  afterAll(async () => {
    await truncate(client.db, [invitation, organizationUser, organization, user]);
    await client.close();
  });

  async function membershipRole(userId: string, orgId: string): Promise<string | null> {
    const [row] = await client.db
      .select({ role: organizationUser.role })
      .from(organizationUser)
      .where(and(eq(organizationUser.userId, userId), eq(organizationUser.orgId, orgId)))
      .limit(1);
    return row?.role ?? null;
  }

  it('returns a one-time raw token in a copyable link, and stores only its hash', async () => {
    const res = await service.create(activeOwnerA(), {
      email: 'new@example.com',
      orgRole: 'MEMBER',
    });

    expect(res.token).toMatch(/^inv_/);
    expect(res.acceptUrl).toBe(`http://localhost:5173/invite/${res.token}`);

    const [row] = await client.db
      .select({ tokenHash: invitation.tokenHash })
      .from(invitation)
      .where(eq(invitation.id, res.id))
      .limit(1);
    // At rest it is the hash, never the raw token.
    expect(row!.tokenHash).toBe(createHash('sha256').update(res.token).digest('hex'));
    expect(row!.tokenHash).not.toBe(res.token);
  });

  it('previews safely by token: org, role, email, signup-needed — nothing sensitive', async () => {
    const { token } = await service.create(activeOwnerA(), {
      email: 'new@example.com',
      orgRole: 'ADMIN',
    });

    const preview = await service.preview(token);
    expect(preview).toEqual({
      orgName: 'Org A',
      orgRole: 'ADMIN',
      email: 'new@example.com',
      status: 'pending',
      requiresSignup: true,
    });
  });

  it('a NEW-user accept lands a membership in the invite org (A) and NOWHERE else', async () => {
    const { token } = await service.create(activeOwnerA(), {
      email: 'new@example.com',
      orgRole: 'MEMBER',
    });

    const { response } = await service.acceptAsNewUser({
      token,
      name: 'New Person',
      password: 'Sup3rSecret!',
    });

    expect(response.orgId).toBe(orgA);
    expect(await membershipRole(response.user.id, orgA)).toBe('MEMBER');
    // The boundary: bound to A, so it created nothing in B.
    expect(await membershipRole(response.user.id, orgB)).toBeNull();
  });

  it('spends the token once — a second accept is rejected', async () => {
    const { token } = await service.create(activeOwnerA(), {
      email: 'new@example.com',
      orgRole: 'MEMBER',
    });
    await service.acceptAsNewUser({ token, name: 'N', password: 'Sup3rSecret!' });

    await expect(
      service.acceptAsNewUser({ token, name: 'N2', password: 'Sup3rSecret!' }),
    ).rejects.toBeInstanceOf(GoneException);
  });

  it('refuses a new-user accept when an account already exists for the email', async () => {
    // owner-b already has an account; inviting that email into A must route to
    // the authenticated path, not create a second account.
    const { token } = await service.create(activeOwnerA(), {
      email: 'owner-b@example.com',
      orgRole: 'MEMBER',
    });

    await expect(
      service.acceptAsNewUser({ token, name: 'X', password: 'Sup3rSecret!' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('lets an existing, email-matching account join via the authenticated path', async () => {
    const { token } = await service.create(activeOwnerA(), {
      email: 'owner-b@example.com',
      orgRole: 'ADMIN',
    });

    const res = await service.acceptAsMember(activeOwnerB(), { token });

    expect(res).toEqual({ orgId: orgA, orgName: 'Org A' });
    expect(await membershipRole(ownerB, orgA)).toBe('ADMIN');
  });

  it('is email-bound: a logged-in user whose email differs cannot redeem', async () => {
    // Invite is addressed to a stranger; owner-b (a different account) holds the
    // link and is logged in. A forwarded link must not let them in.
    const { token } = await service.create(activeOwnerA(), {
      email: 'stranger@example.com',
      orgRole: 'MEMBER',
    });

    await expect(service.acceptAsMember(activeOwnerB(), { token })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(await membershipRole(ownerB, orgA)).toBeNull();
  });

  it('is idempotent: an already-member accept adds no duplicate row', async () => {
    const { token } = await service.create(activeOwnerA(), {
      email: 'owner-b@example.com',
      orgRole: 'ADMIN',
    });
    await service.acceptAsMember(activeOwnerB(), { token });

    // A second, redundant accept (e.g. link re-click) still succeeds and does
    // not create a second membership — the composite PK holds one row.
    const again = await service.acceptAsMember(activeOwnerB(), { token });
    expect(again.orgId).toBe(orgA);

    const rows = await client.db
      .select()
      .from(organizationUser)
      .where(and(eq(organizationUser.userId, ownerB), eq(organizationUser.orgId, orgA)));
    expect(rows).toHaveLength(1);
  });

  it('rejects a revoked invite cleanly', async () => {
    const created = await service.create(activeOwnerA(), {
      email: 'owner-b@example.com',
      orgRole: 'MEMBER',
    });
    await service.revoke(activeOwnerA(), created.id);

    await expect(
      service.acceptAsMember(activeOwnerB(), { token: created.token }),
    ).rejects.toBeInstanceOf(GoneException);
  });

  it('rejects an expired invite cleanly', async () => {
    const created = await service.create(activeOwnerA(), {
      email: 'owner-b@example.com',
      orgRole: 'MEMBER',
    });
    // Force it past expiry.
    await client.db
      .update(invitation)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(invitation.id, created.id));

    await expect(
      service.acceptAsMember(activeOwnerB(), { token: created.token }),
    ).rejects.toBeInstanceOf(GoneException);
    // And preview reports it as expired.
    expect((await service.preview(created.token)).status).toBe('expired');
  });

  it('refuses to invite someone already a member', async () => {
    await expect(
      service.create(activeOwnerA(), { email: 'owner-a@example.com', orgRole: 'MEMBER' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  // --- Two-tenant convention ------------------------------------------------

  it('scopes revoke and list to the acting org — one tenant cannot touch another', async () => {
    const inviteA = await service.create(activeOwnerA(), {
      email: 'a-invitee@example.com',
      orgRole: 'MEMBER',
    });
    await service.create(activeOwnerB(), { email: 'b-invitee@example.com', orgRole: 'MEMBER' });

    // Org B's owner cannot revoke org A's invite (id belongs to A).
    await expect(service.revoke(activeOwnerB(), inviteA.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    // Each list shows only its own org's pending invite.
    const listA = await service.list(activeOwnerA());
    const listB = await service.list(activeOwnerB());
    expect(listA.data.map((i) => i.email)).toEqual(['a-invitee@example.com']);
    expect(listB.data.map((i) => i.email)).toEqual(['b-invitee@example.com']);
  });

  it('raises an in-app notice when the invited email already has an account', async () => {
    await service.create(activeOwnerA(), { email: 'owner-b@example.com', orgRole: 'MEMBER' });
    expect(notifications.create).toHaveBeenCalledTimes(1);
    const arg = notifications.create.mock.calls[0]![0] as { userId: string; orgId: string };
    expect(arg.userId).toBe(ownerB);
    expect(arg.orgId).toBe(orgA);
  });
});
