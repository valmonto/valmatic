import { Inject, Injectable } from '@nestjs/common';
import {
  DATABASE_CLIENT,
  type DatabaseClient,
  and,
  count,
  emailVerification,
  eq,
  gt,
  gte,
  isNull,
  lt,
  sql,
  user,
} from '@pkg/database';

export interface VerifyAccount {
  id: string;
  email: string;
  verified: boolean;
  disabled: boolean;
}

/** Postgres' "unique_violation". */
const UNIQUE_VIOLATION = '23505';

@Injectable()
export class EmailVerificationRepository {
  constructor(@Inject(DATABASE_CLIENT) private readonly dbClient: DatabaseClient) {}

  async findAccount(userId: string): Promise<VerifyAccount | null> {
    const [row] = await this.dbClient.db
      .select({
        id: user.id,
        email: user.email,
        emailVerifiedAt: user.emailVerifiedAt,
        disabledAt: user.disabledAt,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      verified: row.emailVerifiedAt !== null,
      disabled: row.disabledAt !== null,
    };
  }

  /** How many links this account was mailed since a moment. */
  async countSince(userId: string, since: Date): Promise<number> {
    const [row] = await this.dbClient.db
      .select({ n: count() })
      .from(emailVerification)
      .where(and(eq(emailVerification.userId, userId), gte(emailVerification.createdAt, since)));
    return row?.n ?? 0;
  }

  /** Record a link about to be mailed, dropping this account's rows too old to matter. */
  async create(input: {
    userId: string;
    email: string;
    tokenHash: string;
    expiresAt: Date;
    forgetBefore: Date;
  }): Promise<void> {
    await this.dbClient.db.transaction(async (tx) => {
      await tx
        .delete(emailVerification)
        .where(
          and(
            eq(emailVerification.userId, input.userId),
            lt(emailVerification.createdAt, input.forgetBefore),
          ),
        );
      await tx.insert(emailVerification).values({
        userId: input.userId,
        email: input.email,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
      });
    });
  }

  /**
   * Open a link: mark it used, and confirm the account's address — but only
   * if the account still has the address the link was mailed to. One
   * transaction, and the first UPDATE is the lock: of two requests with the
   * same link, one finds it unused.
   *
   * Returns the confirmed address, or null when the link was not good.
   */
  async consume(tokenHash: string, now: Date): Promise<string | null> {
    return this.dbClient.db.transaction(async (tx) => {
      const [link] = await tx
        .update(emailVerification)
        .set({ usedAt: now })
        .where(
          and(
            eq(emailVerification.tokenHash, tokenHash),
            isNull(emailVerification.usedAt),
            gt(emailVerification.expiresAt, now),
          ),
        )
        .returning({ userId: emailVerification.userId, email: emailVerification.email });
      if (!link) return null;

      const [account] = await tx
        .update(user)
        .set({ emailVerifiedAt: now })
        .where(
          and(eq(user.id, link.userId), sql`lower(${user.email}) = ${link.email.toLowerCase()}`),
        )
        .returning({ email: user.email });
      // The address was changed after this link went out: it confirms nothing.
      if (!account) return null;

      await tx
        .update(emailVerification)
        .set({ usedAt: now })
        .where(and(eq(emailVerification.userId, link.userId), isNull(emailVerification.usedAt)));
      return account.email;
    });
  }

  /**
   * Replace an address nobody has confirmed. Refused (false) when the account
   * is confirmed by now or another account holds the address. Every open link
   * of the old address is closed with it.
   */
  async changeUnverified(userId: string, email: string, now: Date): Promise<boolean> {
    try {
      return await this.dbClient.db.transaction(async (tx) => {
        const taken = await tx
          .select({ id: user.id })
          .from(user)
          .where(sql`lower(${user.email}) = ${email.toLowerCase()} and ${user.id} <> ${userId}`)
          .limit(1);
        if (taken.length > 0) return false;

        const changed = await tx
          .update(user)
          .set({ email })
          .where(and(eq(user.id, userId), isNull(user.emailVerifiedAt)))
          .returning({ id: user.id });
        if (changed.length === 0) return false;

        await tx
          .update(emailVerification)
          .set({ usedAt: now })
          .where(and(eq(emailVerification.userId, userId), isNull(emailVerification.usedAt)));
        return true;
      });
    } catch (error) {
      // Two accounts racing for the same address: the unique index decides.
      if ((error as { cause?: { code?: string } }).cause?.code === UNIQUE_VIOLATION) return false;
      if ((error as { code?: string }).code === UNIQUE_VIOLATION) return false;
      throw error;
    }
  }
}
