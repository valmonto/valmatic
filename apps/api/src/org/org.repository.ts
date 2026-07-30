import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  DATABASE_CLIENT,
  type DatabaseClient,
  organization,
  organizationUser,
  eq,
  and,
  count,
} from '@pkg/database';
import { k } from '@pkg/locales';
import type { OrganizationUserRole } from '@pkg/contracts';

export interface OrgRecord {
  id: string;
  name: string;
  role: OrganizationUserRole;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class OrgRepository {
  constructor(@Inject(DATABASE_CLIENT) private readonly dbClient: DatabaseClient) {}

  async findOrgsForUser(userId: string): Promise<OrgRecord[]> {
    const result = await this.dbClient.db
      .select({
        id: organization.id,
        name: organization.name,
        role: organizationUser.role,
        createdAt: organization.createdAt,
        updatedAt: organization.updatedAt,
      })
      .from(organization)
      .innerJoin(organizationUser, eq(organizationUser.orgId, organization.id))
      .where(eq(organizationUser.userId, userId))
      .orderBy(organization.name);

    return result as OrgRecord[];
  }

  async findOrgForUser(orgId: string, userId: string): Promise<OrgRecord | null> {
    const result = await this.dbClient.db
      .select({
        id: organization.id,
        name: organization.name,
        role: organizationUser.role,
        createdAt: organization.createdAt,
        updatedAt: organization.updatedAt,
      })
      .from(organization)
      .innerJoin(
        organizationUser,
        and(eq(organizationUser.orgId, organization.id), eq(organizationUser.userId, userId)),
      )
      .where(eq(organization.id, orgId))
      .limit(1);

    return (result[0] as OrgRecord) ?? null;
  }

  async createOrg(data: { name: string; ownerId: string }): Promise<OrgRecord> {
    return this.dbClient.db.transaction(async (tx) => {
      const [newOrg] = await tx
        .insert(organization)
        .values({
          name: data.name,
          ownerId: data.ownerId,
        })
        .returning();

      if (!newOrg) {
        throw new InternalServerErrorException(k.common.errors.failedToCreateOrg);
      }

      await tx.insert(organizationUser).values({
        orgId: newOrg.id,
        userId: data.ownerId,
        role: 'OWNER',
      });

      return {
        id: newOrg.id,
        name: newOrg.name,
        role: 'OWNER' as OrganizationUserRole,
        createdAt: newOrg.createdAt,
        updatedAt: newOrg.updatedAt,
      };
    });
  }

  /**
   * Returns the updated row rather than void, so the caller does not need a
   * second query — which previously had its own failure branch throwing a 500
   * for a write that had already succeeded.
   */
  async updateOrg(
    orgId: string,
    data: { name?: string },
  ): Promise<Omit<OrgRecord, 'role'> | null> {
    if (data.name === undefined) {
      const [row] = await this.dbClient.db
        .select({
          id: organization.id,
          name: organization.name,
          createdAt: organization.createdAt,
          updatedAt: organization.updatedAt,
        })
        .from(organization)
        .where(eq(organization.id, orgId))
        .limit(1);
      return row ?? null;
    }

    const [row] = await this.dbClient.db
      .update(organization)
      .set({ name: data.name })
      .where(eq(organization.id, orgId))
      .returning({
        id: organization.id,
        name: organization.name,
        createdAt: organization.createdAt,
        updatedAt: organization.updatedAt,
      });

    return row ?? null;
  }

  async deleteOrg(orgId: string): Promise<void> {
    // Organization users will be cascade deleted
    await this.dbClient.db.delete(organization).where(eq(organization.id, orgId));
  }

  /** Platform-admin view: every organization, no membership filter on purpose. */
  async findAllOrgs(opts: { skip: number; limit: number }): Promise<{
    data: Array<{
      id: string;
      name: string;
      memberCount: number;
      createdAt: Date;
      updatedAt: Date;
    }>;
    total: number;
  }> {
    const [data, totalResult] = await Promise.all([
      this.dbClient.db
        .select({
          id: organization.id,
          name: organization.name,
          memberCount: count(organizationUser.userId),
          createdAt: organization.createdAt,
          updatedAt: organization.updatedAt,
        })
        .from(organization)
        .leftJoin(organizationUser, eq(organizationUser.orgId, organization.id))
        .groupBy(organization.id)
        .orderBy(organization.name)
        .offset(opts.skip)
        .limit(opts.limit),
      this.dbClient.db.select({ count: count() }).from(organization),
    ]);

    return { data, total: totalResult[0]?.count ?? 0 };
  }

  async findOrgById(
    orgId: string,
  ): Promise<{ id: string; name: string } | null> {
    const [row] = await this.dbClient.db
      .select({ id: organization.id, name: organization.name })
      .from(organization)
      .where(eq(organization.id, orgId))
      .limit(1);

    return row ?? null;
  }

  async countUserOrgs(userId: string): Promise<number> {
    const [result] = await this.dbClient.db
      .select({ count: count() })
      .from(organizationUser)
      .where(eq(organizationUser.userId, userId));

    return result?.count ?? 0;
  }

  async getUserRoleInOrg(userId: string, orgId: string): Promise<OrganizationUserRole | null> {
    const result = await this.dbClient.db
      .select({ role: organizationUser.role })
      .from(organizationUser)
      .where(and(eq(organizationUser.userId, userId), eq(organizationUser.orgId, orgId)))
      .limit(1);

    return (result[0]?.role as OrganizationUserRole) ?? null;
  }
}
