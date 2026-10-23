import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  DATABASE_CLIENT,
  type DatabaseClient,
  user,
  organization,
  organizationUser,
  eq,
  and,
  isNull,
  User,
  Organization,
  OrganizationUser,
  OrganizationUserRole,
  SystemRole,
  userIdentity,
} from '@pkg/database';
import { k } from '@pkg/locales';
import { placeNewAccount } from '../org/place-new-account.js';
import type { AuthIdentityProvider } from '@pkg/contracts';

@Injectable()
export class AuthRepository {
  constructor(@Inject(DATABASE_CLIENT) private readonly dbClient: DatabaseClient) {}

  /**
   * A new account and its place: its own organization, or the one
   * organization every account joins (see `placeNewAccount`).
   */
  async createUserWithOrganization({
    email,
    name,
    passwordHash,
    organizationName,
    multiOrg,
  }: {
    email: string;
    name: string;
    passwordHash: string;
    organizationName: string;
    multiOrg: boolean;
  }): Promise<{ user: User; orgUser: OrganizationUser }> {
    return this.dbClient.db.transaction(async (tx) => {
      const [newUser] = await tx.insert(user).values({ email, name, passwordHash }).returning();
      if (!newUser) {
        throw new InternalServerErrorException(k.common.errors.failedToCreateUser);
      }
      const orgUser = await placeNewAccount(tx, newUser.id, { multiOrg, organizationName });
      return { user: newUser, orgUser };
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
    systemRole: SystemRole;
    orgId: string;
    emailVerified: boolean;
    hasPassword: boolean;
  } | null> {
    const result = await this.dbClient.db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        displayName: user.displayName,
        role: organizationUser.role,
        systemRole: user.systemRole,
        orgId: organizationUser.orgId,
        emailVerifiedAt: user.emailVerifiedAt,
        passwordHash: user.passwordHash,
      })
      .from(user)
      .innerJoin(
        organizationUser,
        and(eq(organizationUser.userId, user.id), eq(organizationUser.orgId, orgId)),
      )
      // A disabled account has no access at all. This read is what the auth
      // guard's refresh re-verifies against (`OrgAccessProvider`) and what
      // `/auth/me` returns, so excluding it here ends a disabled account's
      // session at the next refresh even if a revoke was somehow missed.
      .where(and(eq(user.id, userId), isNull(user.disabledAt)))
      .limit(1);

    const row = result[0];
    if (!row) return null;
    const { emailVerifiedAt, passwordHash, ...rest } = row;
    return {
      ...rest,
      emailVerified: emailVerifiedAt !== null,
      // Only a bcrypt hash is a password; an account made through Apple or
      // Google holds a marker no password matches.
      hasPassword: passwordHash.startsWith('$2'),
    };
  }

  /** The Apple and Google accounts linked to this one. */
  async findProvidersForUser(userId: string): Promise<AuthIdentityProvider[]> {
    const rows = await this.dbClient.db
      .select({ provider: userIdentity.provider })
      .from(userIdentity)
      .where(eq(userIdentity.userId, userId));
    return [...new Set(rows.map((row) => row.provider))];
  }

  async findUserById(userId: string): Promise<User | null> {
    const result = await this.dbClient.db.select().from(user).where(eq(user.id, userId)).limit(1);
    return result[0] ?? null;
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.dbClient.db.update(user).set({ passwordHash }).where(eq(user.id, userId));
  }
}
