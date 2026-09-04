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

  /**
   * The user's email and name by id — for callers that hold a session userId
   * but no org membership yet (e.g. accepting an invitation into a NEW org, so
   * `findUserInOrg` would find nothing). Not org-scoped on purpose: the account
   * itself is a platform record, and identity here comes from the verified
   * session, never a payload.
   */
  async findAccountById(
    userId: string,
  ): Promise<{ id: string; email: string; name: string } | null> {
    const [row] = await this.dbClient.db
      .select({ id: user.id, email: user.email, name: user.name })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return row ?? null;
  }

  /** True when the user already belongs to the org — the idempotency guard. */
  async isMember(userId: string, orgId: string): Promise<boolean> {
    const [row] = await this.dbClient.db
      .select({ userId: organizationUser.userId })
      .from(organizationUser)
      .where(and(eq(organizationUser.userId, userId), eq(organizationUser.orgId, orgId)))
      .limit(1);

    return Boolean(row);
  }

  /**
   * Add an existing user to an organization at a role. Idempotent: a repeated
   * call for an existing membership is a no-op (never a duplicate row, which the
   * composite PK would reject anyway), so accepting the same invite twice is
   * safe. Returns true when a new membership was created.
   */
  async addOrgMembership(
    userId: string,
    orgId: string,
    role: OrganizationUserRole,
  ): Promise<boolean> {
    const inserted = await this.dbClient.db
      .insert(organizationUser)
      .values({ orgId, userId, role })
      .onConflictDoNothing()
      .returning();

    return inserted.length > 0;
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
      // The `user` row is shared across organizations, so the update below cannot
      // carry an org predicate of its own. Establish membership first: without
      // this, a caller passing an org the user does not belong to still renames
      // the account, and the org-scoped select at the end returns null while that
      // write has already committed.
      const membership = await tx
        .select({ userId: organizationUser.userId })
        .from(organizationUser)
        .where(and(eq(organizationUser.userId, userId), eq(organizationUser.orgId, orgId)))
        .limit(1);

      if (membership.length === 0) return null;

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
