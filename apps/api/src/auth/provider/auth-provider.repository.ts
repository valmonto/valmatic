import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  DATABASE_CLIENT,
  type DatabaseClient,
  type User,
  type UserIdentityRow,
  and,
  eq,
  isNull,
  organization,
  organizationUser,
  user,
  userIdentity,
} from '@pkg/database';
import { k } from '@pkg/locales';
import type { AuthIdentityProvider } from '@pkg/contracts';

/**
 * Reads and writes for Apple and Google sign-in. Lookups are by
 * `(provider, subject)`, never by email — see the table's own comment.
 */
@Injectable()
export class AuthProviderRepository {
  constructor(@Inject(DATABASE_CLIENT) private readonly dbClient: DatabaseClient) {}

  async findIdentity(
    provider: AuthIdentityProvider,
    subject: string,
  ): Promise<{ identity: UserIdentityRow; user: User } | null> {
    const [row] = await this.dbClient.db
      .select({ identity: userIdentity, user })
      .from(userIdentity)
      .innerJoin(user, eq(user.id, userIdentity.userId))
      .where(and(eq(userIdentity.provider, provider), eq(userIdentity.subject, subject)))
      .limit(1);
    return row ?? null;
  }

  /** Bumped on every sign-in: the one sign that a link is still in use. */
  async touch(identityId: string): Promise<void> {
    await this.dbClient.db
      .update(userIdentity)
      .set({ lastSeenAt: new Date() })
      .where(eq(userIdentity.id, identityId));
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const [row] = await this.dbClient.db
      .select()
      .from(user)
      .where(eq(user.email, email.toLowerCase()))
      .limit(1);
    return row ?? null;
  }

  /**
   * Link a provider to an account that already holds the address it vouched
   * for. If nobody had confirmed that address, it is confirmed now and the
   * password the account was made with stops working (`noPassword`): whoever
   * chose it never proved the address was theirs — it may be someone who
   * signed up with another person's address first. Answers whether that
   * happened, so the caller can end the account's other sessions.
   */
  async linkIdentity(input: {
    userId: string;
    provider: AuthIdentityProvider;
    subject: string;
    email: string | null;
    noPassword: string;
  }): Promise<{ identity: UserIdentityRow; claimed: boolean }> {
    return this.dbClient.db.transaction(async (tx) => {
      const [identity] = await tx
        .insert(userIdentity)
        .values({
          userId: input.userId,
          provider: input.provider,
          subject: input.subject,
          email: input.email,
        })
        .returning();
      if (!identity) throw new InternalServerErrorException(k.common.errors.failedToCreateUser);

      const claimed = await tx
        .update(user)
        .set({ emailVerifiedAt: new Date(), passwordHash: input.noPassword })
        .where(and(eq(user.id, input.userId), isNull(user.emailVerifiedAt)))
        .returning({ id: user.id });
      return { identity, claimed: claimed.length > 0 };
    });
  }

  /**
   * A new account from a provider: the user, an organization of their own
   * (they are its OWNER, as with `POST /auth/register`) and the link, in one
   * transaction so a half-made account cannot exist.
   */
  async createAccount(input: {
    email: string;
    name: string;
    passwordHash: string;
    emailVerified: boolean;
    organizationName: string;
    provider: AuthIdentityProvider;
    subject: string;
    providerEmail: string | null;
  }): Promise<User> {
    return this.dbClient.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(user)
        .values({
          email: input.email,
          name: input.name,
          passwordHash: input.passwordHash,
          emailVerifiedAt: input.emailVerified ? new Date() : null,
        })
        .returning();
      if (!created) throw new InternalServerErrorException(k.common.errors.failedToCreateUser);

      const [org] = await tx
        .insert(organization)
        .values({ name: input.organizationName, ownerId: created.id })
        .returning();
      if (!org) throw new InternalServerErrorException(k.common.errors.failedToCreateOrg);

      await tx
        .insert(organizationUser)
        .values({ orgId: org.id, userId: created.id, role: 'OWNER' });
      await tx.insert(userIdentity).values({
        userId: created.id,
        provider: input.provider,
        subject: input.subject,
        email: input.providerEmail,
      });
      return created;
    });
  }
}
