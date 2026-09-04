import { Inject, Injectable } from '@nestjs/common';
import {
  DATABASE_CLIENT,
  type DatabaseClient,
  invitation,
  organization,
  eq,
  and,
  gt,
  desc,
} from '@pkg/database';
import type { InvitationStatus, OrganizationUserRole } from '@pkg/contracts';

/** An invitation row joined to its organization's display name. */
export interface InvitationWithOrg {
  id: string;
  orgId: string;
  orgName: string;
  email: string;
  role: OrganizationUserRole;
  status: InvitationStatus;
  expiresAt: Date;
  createdAt: Date;
}

export interface InvitationRecord {
  id: string;
  orgId: string;
  email: string;
  role: OrganizationUserRole;
  status: InvitationStatus;
  expiresAt: Date;
  createdAt: Date;
}

@Injectable()
export class InvitationRepository {
  constructor(@Inject(DATABASE_CLIENT) private readonly dbClient: DatabaseClient) {}

  async create(data: {
    orgId: string;
    email: string;
    role: OrganizationUserRole;
    tokenHash: string;
    expiresAt: Date;
    invitedBy: string;
  }): Promise<InvitationRecord> {
    const [row] = await this.dbClient.db
      .insert(invitation)
      .values({
        orgId: data.orgId,
        email: data.email,
        role: data.role,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        invitedBy: data.invitedBy,
      })
      .returning();

    return this.toRecord(row!);
  }

  /**
   * Revoke any still-pending invite for this org+email. Called before issuing a
   * fresh one so "pending invites" never accumulates duplicates for the same
   * recipient — the newest link is the only live one.
   */
  async supersedePendingFor(orgId: string, email: string): Promise<void> {
    await this.dbClient.db
      .update(invitation)
      .set({ status: 'revoked' })
      .where(
        and(
          eq(invitation.orgId, orgId),
          eq(invitation.email, email),
          eq(invitation.status, 'pending'),
        ),
      );
  }

  /** Pending, unexpired invites for the active org — the admin list. */
  async listPending(orgId: string, now: Date): Promise<InvitationRecord[]> {
    const rows = await this.dbClient.db
      .select()
      .from(invitation)
      .where(
        and(
          eq(invitation.orgId, orgId),
          eq(invitation.status, 'pending'),
          gt(invitation.expiresAt, now),
        ),
      )
      .orderBy(desc(invitation.createdAt));

    return rows.map((r) => this.toRecord(r));
  }

  /**
   * Resolve an invite by its raw-token hash. Token possession IS the credential
   * here, so this is deliberately NOT org-scoped — the preview and accept paths
   * are reached without a session. Joins the org name for the response.
   */
  async findByTokenHash(tokenHash: string): Promise<InvitationWithOrg | null> {
    const [row] = await this.dbClient.db
      .select({
        id: invitation.id,
        orgId: invitation.orgId,
        orgName: organization.name,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
      })
      .from(invitation)
      .innerJoin(organization, eq(organization.id, invitation.orgId))
      .where(eq(invitation.tokenHash, tokenHash))
      .limit(1);

    return (row as InvitationWithOrg) ?? null;
  }

  /**
   * Revoke a pending invite the caller's org owns. Org-scoped: an id belonging
   * to another organization matches nothing, so one tenant can never revoke
   * another's invite. Returns true when a row was actually revoked.
   */
  async revoke(id: string, orgId: string): Promise<boolean> {
    const revoked = await this.dbClient.db
      .update(invitation)
      .set({ status: 'revoked' })
      .where(
        and(eq(invitation.id, id), eq(invitation.orgId, orgId), eq(invitation.status, 'pending')),
      )
      .returning();

    return revoked.length > 0;
  }

  /**
   * Atomically consume a pending invite (pending → accepted), returning true
   * only to the caller that won the transition. This is the single-use gate:
   * two concurrent accepts race on the same `WHERE status = 'pending'`, and
   * exactly one UPDATE affects a row.
   */
  async consumePending(id: string): Promise<boolean> {
    const consumed = await this.dbClient.db
      .update(invitation)
      .set({ status: 'accepted' })
      .where(and(eq(invitation.id, id), eq(invitation.status, 'pending')))
      .returning();

    return consumed.length > 0;
  }

  private toRecord(row: typeof invitation.$inferSelect): InvitationRecord {
    return {
      id: row.id,
      orgId: row.orgId,
      email: row.email,
      role: row.role,
      status: row.status,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
    };
  }
}
