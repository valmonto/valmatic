import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  DATABASE_CLIENT,
  type DatabaseClient,
  organization,
  organizationUser,
  eq,
  and,
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

  async createOrg(data: {
    name: string;
    ownerId: string;
  }): Promise<OrgRecord> {
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

  async updateOrg(orgId: string, data: { name?: string }): Promise<void> {
    if (data.name !== undefined) {
      await this.dbClient.db
        .update(organization)
        .set({ name: data.name })
        .where(eq(organization.id, orgId));
    }
  }

  async deleteOrg(orgId: string): Promise<void> {
    // Organization users will be cascade deleted
    await this.dbClient.db.delete(organization).where(eq(organization.id, orgId));
  }

  async countUserOrgs(userId: string): Promise<number> {
    const result = await this.dbClient.db
      .select({ id: organizationUser.orgId })
      .from(organizationUser)
      .where(eq(organizationUser.userId, userId));

    return result.length;
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
