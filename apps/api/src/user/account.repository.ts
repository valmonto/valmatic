import { Inject, Injectable } from '@nestjs/common';
import {
  DATABASE_CLIENT,
  type DatabaseClient,
  apiKey,
  attachment,
  notification,
  organization,
  organizationUser,
  user,
  userIdentity,
  and,
  asc,
  count,
  eq,
  inArray,
  isNull,
  ne,
} from '@pkg/database';
import type { OrganizationUserRole } from '@pkg/contracts';

export interface Membership {
  orgId: string;
  orgName: string;
  role: OrganizationUserRole;
  joinedAt: Date;
  /** The organization's creator (`organization.owner_id`). */
  createdBy: string;
  /** Everyone in the organization, this person included. */
  memberCount: number;
  /** Another OWNER, the first to have joined — who takes over if needed. */
  otherOwnerId: string | null;
  /** Anyone else at all: who becomes the creator when no other owner exists. */
  otherMemberId: string | null;
}

/**
 * Queries about one person's own account, across every organization they
 * are in. Deleting and exporting are the account owner's acts, so nothing
 * here is scoped to the session's active organization.
 */
@Injectable()
export class AccountRepository {
  constructor(@Inject(DATABASE_CLIENT) private readonly dbClient: DatabaseClient) {}

  async findPasswordHash(userId: string): Promise<string | null> {
    const [row] = await this.dbClient.db
      .select({ passwordHash: user.passwordHash })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    return row?.passwordHash ?? null;
  }

  async findMemberships(userId: string): Promise<Membership[]> {
    const db = this.dbClient.db;
    const rows = await db
      .select({
        orgId: organization.id,
        orgName: organization.name,
        role: organizationUser.role,
        joinedAt: organizationUser.joinedAt,
        createdBy: organization.ownerId,
      })
      .from(organizationUser)
      .innerJoin(organization, eq(organization.id, organizationUser.orgId))
      .where(eq(organizationUser.userId, userId))
      .orderBy(asc(organizationUser.joinedAt));
    if (rows.length === 0) return [];

    const orgIds = rows.map((r) => r.orgId);
    const counts = await db
      .select({ orgId: organizationUser.orgId, n: count() })
      .from(organizationUser)
      .where(inArray(organizationUser.orgId, orgIds))
      .groupBy(organizationUser.orgId);
    const others = await db
      .select({
        orgId: organizationUser.orgId,
        userId: organizationUser.userId,
        role: organizationUser.role,
      })
      .from(organizationUser)
      .where(and(inArray(organizationUser.orgId, orgIds), ne(organizationUser.userId, userId)))
      .orderBy(asc(organizationUser.joinedAt));

    return rows.map((r) => {
      const inOrg = others.filter((o) => o.orgId === r.orgId);
      return {
        ...r,
        memberCount: counts.find((c) => c.orgId === r.orgId)?.n ?? 1,
        otherOwnerId: inOrg.find((o) => o.role === 'OWNER')?.userId ?? null,
        otherMemberId: inOrg[0]?.userId ?? null,
      };
    });
  }

  /**
   * One transaction, so a failure leaves the account whole. Organizations in
   * `deleteOrgIds` go with everything in them (cascade). Each `handOver`
   * moves an organization's creator to another owner — `owner_id` refuses
   * to point at nobody. The account row last: its memberships, notifications,
   * API keys and one-time tokens cascade; its uploads stay with their
   * organization, unattributed.
   */
  async deleteAccount(
    userId: string,
    plan: { deleteOrgIds: string[]; handOver: Array<{ orgId: string; to: string }> },
  ): Promise<void> {
    await this.dbClient.db.transaction(async (tx) => {
      if (plan.deleteOrgIds.length > 0) {
        await tx.delete(organization).where(inArray(organization.id, plan.deleteOrgIds));
      }
      for (const { orgId, to } of plan.handOver) {
        await tx.update(organization).set({ ownerId: to }).where(eq(organization.id, orgId));
      }
      await tx.delete(user).where(eq(user.id, userId));
    });
  }

  async findAccount(userId: string) {
    const [row] = await this.dbClient.db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        displayName: user.displayName,
        phone: user.phone,
        systemRole: user.systemRole,
        emailVerifiedAt: user.emailVerifiedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    return row ?? null;
  }

  async findNotifications(userId: string) {
    return this.dbClient.db
      .select({
        id: notification.id,
        orgId: notification.orgId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link,
        createdAt: notification.createdAt,
      })
      .from(notification)
      .where(eq(notification.userId, userId))
      .orderBy(asc(notification.createdAt));
  }

  async findUploads(userId: string) {
    return this.dbClient.db
      .select({
        id: attachment.id,
        orgId: attachment.orgId,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
        createdAt: attachment.createdAt,
      })
      .from(attachment)
      .where(and(eq(attachment.uploadedBy, userId), isNull(attachment.deletedAt)))
      .orderBy(asc(attachment.createdAt));
  }

  async findSignInProviders(userId: string) {
    return this.dbClient.db
      .select({
        provider: userIdentity.provider,
        email: userIdentity.email,
        createdAt: userIdentity.createdAt,
        lastSeenAt: userIdentity.lastSeenAt,
      })
      .from(userIdentity)
      .where(eq(userIdentity.userId, userId))
      .orderBy(asc(userIdentity.createdAt));
  }

  async findApiKeys(userId: string) {
    return this.dbClient.db
      .select({
        id: apiKey.id,
        name: apiKey.name,
        prefix: apiKey.prefix,
        scopes: apiKey.scopes,
        lastUsedAt: apiKey.lastUsedAt,
        revokedAt: apiKey.revokedAt,
        createdAt: apiKey.createdAt,
      })
      .from(apiKey)
      .where(eq(apiKey.userId, userId))
      .orderBy(asc(apiKey.createdAt));
  }
}
