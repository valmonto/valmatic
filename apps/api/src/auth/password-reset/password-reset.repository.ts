import { Inject, Injectable } from '@nestjs/common';
import {
  DATABASE_CLIENT,
  type DatabaseClient,
  and,
  count,
  eq,
  gt,
  gte,
  isNull,
  lt,
  passwordReset,
  sql,
  user,
} from '@pkg/database';

export interface ResetAccount {
  id: string;
  email: string;
  disabled: boolean;
}

@Injectable()
export class PasswordResetRepository {
  constructor(@Inject(DATABASE_CLIENT) private readonly dbClient: DatabaseClient) {}

  /**
   * The account an address belongs to. Matched without regard to case:
   * people type their address the way their phone capitalises it.
   */
  async findAccountByEmail(email: string): Promise<ResetAccount | null> {
    const rows = await this.dbClient.db
      .select({ id: user.id, email: user.email, disabledAt: user.disabledAt })
      .from(user)
      .where(sql`lower(${user.email}) = ${email.toLowerCase()}`)
      .limit(1);
    return this.toAccount(rows[0]);
  }

  async findAccountById(userId: string): Promise<ResetAccount | null> {
    const rows = await this.dbClient.db
      .select({ id: user.id, email: user.email, disabledAt: user.disabledAt })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    return this.toAccount(rows[0]);
  }

  private toAccount(
    row: { id: string; email: string; disabledAt: Date | null } | undefined,
  ): ResetAccount | null {
    if (!row) return null;
    return { id: row.id, email: row.email, disabled: row.disabledAt !== null };
  }

  /** How many reset emails this account was sent since a moment. */
  async countSince(userId: string, since: Date): Promise<number> {
    const [row] = await this.dbClient.db
      .select({ n: count() })
      .from(passwordReset)
      .where(and(eq(passwordReset.userId, userId), gte(passwordReset.createdAt, since)));
    return row?.n ?? 0;
  }

  /**
   * Record a link that is about to be mailed, and drop this account's rows
   * that are too old to matter to either the link or the daily count.
   */
  async create(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    forgetBefore: Date;
  }): Promise<void> {
    await this.dbClient.db.transaction(async (tx) => {
      await tx
        .delete(passwordReset)
        .where(
          and(
            eq(passwordReset.userId, input.userId),
            lt(passwordReset.createdAt, input.forgetBefore),
          ),
        );
      await tx.insert(passwordReset).values({
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
      });
    });
  }

  /** The account a link belongs to, while the link is unused and in time. */
  async findOpenUserId(tokenHash: string, now: Date): Promise<string | null> {
    const rows = await this.dbClient.db
      .select({ userId: passwordReset.userId })
      .from(passwordReset)
      .where(
        and(
          eq(passwordReset.tokenHash, tokenHash),
          isNull(passwordReset.usedAt),
          gt(passwordReset.expiresAt, now),
        ),
      )
      .limit(1);
    return rows[0]?.userId ?? null;
  }

  /**
   * Use a link: set the new password and close every open link the account
   * has, as ONE step. The first statement is the lock — of two requests with
   * the same link, only one finds the row still unused.
   *
   * Returns the account's id, or null when the link was not good.
   */
  async consume(tokenHash: string, passwordHash: string, now: Date): Promise<string | null> {
    return this.dbClient.db.transaction(async (tx) => {
      const used = await tx
        .update(passwordReset)
        .set({ usedAt: now })
        .where(
          and(
            eq(passwordReset.tokenHash, tokenHash),
            isNull(passwordReset.usedAt),
            gt(passwordReset.expiresAt, now),
          ),
        )
        .returning({ userId: passwordReset.userId });
      const userId = used[0]?.userId;
      if (!userId) return null;

      await tx.update(user).set({ passwordHash }).where(eq(user.id, userId));
      await tx
        .update(passwordReset)
        .set({ usedAt: now })
        .where(and(eq(passwordReset.userId, userId), isNull(passwordReset.usedAt)));
      return userId;
    });
  }
}
