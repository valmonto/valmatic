import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  DATABASE_CLIENT,
  type DatabaseClient,
  user,
  organizationUser,
  eq,
  and,
  or,
  ilike,
  count,
} from '@pkg/database';
import { k } from '@pkg/locales';
import type { OrganizationUserRole } from '@pkg/contracts';

export interface OrgUserRecord {
  id: string;
  email: string;
  name: string;
  displayName: string | null;
  phone: string | null;
  role: OrganizationUserRole;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UserRepository {
  constructor(@Inject(DATABASE_CLIENT) private readonly dbClient: DatabaseClient) {}

  async findUsersInOrg(
    orgId: string,
    opts: { skip: number; limit: number; search?: string; role?: OrganizationUserRole },
  ): Promise<{ data: OrgUserRecord[]; total: number }> {
    const { skip, limit, search, role } = opts;

    const baseConditions = [eq(organizationUser.orgId, orgId)];

    if (role) {
      baseConditions.push(eq(organizationUser.role, role));
    }

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      baseConditions.push(or(ilike(user.name, searchTerm), ilike(user.email, searchTerm))!);
    }

    const whereClause = and(...baseConditions);

    const [data, totalResult] = await Promise.all([
      this.dbClient.db
        .select({
          id: user.id,
          email: user.email,
          name: user.name,
          displayName: user.displayName,
          phone: user.phone,
          role: organizationUser.role,
          joinedAt: organizationUser.joinedAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })
        .from(user)
        .innerJoin(organizationUser, eq(organizationUser.userId, user.id))
        .where(whereClause)
        .orderBy(user.name)
        .offset(skip)
        .limit(limit),
      this.dbClient.db
        .select({ count: count() })
        .from(user)
        .innerJoin(organizationUser, eq(organizationUser.userId, user.id))
        .where(whereClause),
    ]);

    return {
      data: data as OrgUserRecord[],
      total: totalResult[0]?.count ?? 0,
    };
  }

  async findUserInOrg(userId: string, orgId: string): Promise<OrgUserRecord | null> {
    const result = await this.dbClient.db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        displayName: user.displayName,
        phone: user.phone,
        role: organizationUser.role,
        joinedAt: organizationUser.joinedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .innerJoin(
        organizationUser,
        and(eq(organizationUser.userId, user.id), eq(organizationUser.orgId, orgId)),
      )
      .where(eq(user.id, userId))
      .limit(1);

    return (result[0] as OrgUserRecord) ?? null;
  }

  async findUserByEmail(email: string): Promise<{ id: string } | null> {
    const result = await this.dbClient.db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    return result[0] ?? null;
  }

  async createUserWithOrgMembership(data: {
    email: string;
    name: string;
    passwordHash: string;
    phone?: string;
    orgId: string;
    role: OrganizationUserRole;
  }): Promise<OrgUserRecord> {
    return this.dbClient.db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(user)
        .values({
          email: data.email,
          name: data.name,
          passwordHash: data.passwordHash,
          phone: data.phone,
        })
        .returning();

      if (!newUser) {
        throw new InternalServerErrorException(k.common.errors.failedToCreateUser);
      }

      const [membership] = await tx
        .insert(organizationUser)
        .values({
          orgId: data.orgId,
          userId: newUser.id,
          role: data.role,
        })
        .returning();

      if (!membership) {
        throw new InternalServerErrorException(k.common.errors.failedToCreateOrgMembership);
      }

      return {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        displayName: newUser.displayName,
        phone: newUser.phone,
        role: membership.role as OrganizationUserRole,
        joinedAt: membership.joinedAt,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      };
    });
  }

  async updateUser(
    userId: string,
    orgId: string,
    data: {
      name?: string;
      displayName?: string | null;
      phone?: string | null;
      role?: OrganizationUserRole;
    },
  ): Promise<OrgUserRecord | null> {
    return this.dbClient.db.transaction(async (tx) => {
      // Update user fields if provided
      if (data.name !== undefined || data.displayName !== undefined || data.phone !== undefined) {
        const userUpdates: Record<string, unknown> = {};
        if (data.name !== undefined) userUpdates.name = data.name;
        if (data.displayName !== undefined) userUpdates.displayName = data.displayName;
        if (data.phone !== undefined) userUpdates.phone = data.phone;

        await tx.update(user).set(userUpdates).where(eq(user.id, userId));
      }

      // Update org role if provided
      if (data.role !== undefined) {
        await tx
          .update(organizationUser)
          .set({ role: data.role })
          .where(and(eq(organizationUser.userId, userId), eq(organizationUser.orgId, orgId)));
      }

      // Fetch updated user
      const result = await tx
        .select({
          id: user.id,
          email: user.email,
          name: user.name,
          displayName: user.displayName,
          phone: user.phone,
          role: organizationUser.role,
          joinedAt: organizationUser.joinedAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })
        .from(user)
        .innerJoin(
          organizationUser,
          and(eq(organizationUser.userId, user.id), eq(organizationUser.orgId, orgId)),
        )
        .where(eq(user.id, userId))
        .limit(1);

      return (result[0] as OrgUserRecord) ?? null;
    });
  }

  async removeUserFromOrg(userId: string, orgId: string): Promise<boolean> {
    const result = await this.dbClient.db
      .delete(organizationUser)
      .where(and(eq(organizationUser.userId, userId), eq(organizationUser.orgId, orgId)))
      .returning();

    return result.length > 0;
  }

  async countUserOrgs(userId: string): Promise<number> {
    const result = await this.dbClient.db
      .select({ count: count() })
      .from(organizationUser)
      .where(eq(organizationUser.userId, userId));

    return result[0]?.count ?? 0;
  }

  async deleteUser(userId: string): Promise<void> {
    await this.dbClient.db.delete(user).where(eq(user.id, userId));
  }
}
