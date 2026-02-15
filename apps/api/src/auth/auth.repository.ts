import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  DATABASE_CLIENT,
  DatabaseClient,
  user,
  organization,
  organizationUser,
  eq,
  and,
  User,
  Organization,
  OrganizationUser,
  OrganizationUserRole,
} from '@pkg/database';
import { k } from '@pkg/locales';

@Injectable()
export class AuthRepository {
  constructor(@Inject(DATABASE_CLIENT) private readonly dbClient: DatabaseClient) {}

  async createUserWithOrganization({
    email,
    name,
    passwordHash,
    organizationName,
  }: {
    email: string;
    name: string;
    passwordHash: string;
    organizationName: string;
  }): Promise<{ user: User; org: Organization; orgUser: OrganizationUser }> {
    return this.dbClient.db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(user)
        .values({
          email,
          name,
          passwordHash,
        })
        .returning();

      if (!newUser) {
        throw new InternalServerErrorException(k.common.errors.failedToCreateUser);
      }

      const [newOrg] = await tx
        .insert(organization)
        .values({
          name: organizationName,
          ownerId: newUser.id,
        })
        .returning();

      if (!newOrg) {
        throw new InternalServerErrorException(k.common.errors.failedToCreateOrg);
      }

      const [orgUser] = await tx
        .insert(organizationUser)
        .values({
          orgId: newOrg.id,
          userId: newUser.id,
          role: 'OWNER',
        })
        .returning();

      if (!orgUser) {
        throw new InternalServerErrorException(k.common.errors.failedToCreateOrgMembership);
      }

      return { user: newUser, org: newOrg, orgUser };
    });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const result = await this.dbClient.db.select().from(user).where(eq(user.email, email)).limit(1);

    return result[0] ?? null;
  }

  async findFirstOrgForUser(userId: string): Promise<OrganizationUser | null> {
    const result = await this.dbClient.db
      .select()
      .from(organizationUser)
      .where(eq(organizationUser.userId, userId))
      .limit(1);

    return result[0] ?? null;
  }

  async findUserWithOrg(
    userId: string,
    orgId: string,
  ): Promise<{
    id: string;
    email: string;
    name: string;
    displayName: string | null;
    role: OrganizationUserRole;
    orgId: string;
  } | null> {
    const result = await this.dbClient.db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        displayName: user.displayName,
        role: organizationUser.role,
        orgId: organizationUser.orgId,
      })
      .from(user)
      .innerJoin(
        organizationUser,
        and(eq(organizationUser.userId, user.id), eq(organizationUser.orgId, orgId)),
      )
      .where(eq(user.id, userId))
      .limit(1);

    return result[0] ?? null;
  }

  async findUserById(userId: string): Promise<User | null> {
    const result = await this.dbClient.db.select().from(user).where(eq(user.id, userId)).limit(1);
    return result[0] ?? null;
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.dbClient.db.update(user).set({ passwordHash }).where(eq(user.id, userId));
  }
}
