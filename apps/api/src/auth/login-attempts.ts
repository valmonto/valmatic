import { Inject, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { Redis } from 'ioredis';
import { IAM_REDIS, SECURITY_CONFIG, clientNetwork } from '@pkg/server';

const { LOGIN_MAX_ATTEMPTS, LOGIN_LOCKOUT_SECONDS } = SECURITY_CONFIG;

/** Failed sign-ins to one account, from anywhere, before strangers are turned away. */
export const ACCOUNT_FAILURES_MAX = 30;
const ACCOUNT_WINDOW_SECONDS = 60 * 60;
/** How long a network an account signed in from stays "known" to it. */
const KNOWN_SECONDS = 30 * 24 * 60 * 60;

/**
 * Who may try a password, and how often.
 *
 * Two counts. **Per visitor** — an address and the network it comes from
 * (an IPv6 /64, see `clientNetwork`) — ten wrong tries lock that visitor out
 * for 15 minutes; counted per address alone, anyone could lock the owner out
 * by typing the owner's address wrong. **Per account, across every network**
 * — thirty wrong tries in an hour, and only networks the account has signed
 * in from before may go on trying: guessing from many addresses stops, and
 * the owner, at their usual desk, is never locked out by it.
 *
 * Keys name the address lower-cased; nothing here is logged.
 */
@Injectable()
export class LoginAttempts {
  constructor(@Inject(IAM_REDIS) private readonly redis: Redis) {}

  private visitorKey(email: string, ip: string): string {
    return `iam:login-attempts:${email.toLowerCase()}:${clientNetwork(ip)}`;
  }

  private accountKey(email: string): string {
    return `iam:login-failures:${email.toLowerCase()}`;
  }

  private knownKey(email: string, ip: string): string {
    return `iam:login-known:${email.toLowerCase()}:${clientNetwork(ip)}`;
  }

  /** Whether this visitor may try a password for this address now. */
  async blocked(email: string, ip: string): Promise<boolean> {
    const [visitor, account] = await this.redis.mget(
      this.visitorKey(email, ip),
      this.accountKey(email),
    );
    if (visitor && parseInt(visitor, 10) >= LOGIN_MAX_ATTEMPTS) return true;
    if (account && parseInt(account, 10) >= ACCOUNT_FAILURES_MAX) {
      return (await this.redis.exists(this.knownKey(email, ip))) === 0;
    }
    return false;
  }

  /** A wrong password (or no such account). Answers this visitor's count. */
  async failed(email: string, ip: string): Promise<number> {
    const visitor = this.visitorKey(email, ip);
    const account = this.accountKey(email);
    const [[, count], [, total]] = (await this.redis
      .multi()
      .incr(visitor)
      .incr(account)
      .exec()) as [[null, number], [null, number]];
    if (count === 1) await this.redis.expire(visitor, LOGIN_LOCKOUT_SECONDS);
    if (total === 1) await this.redis.expire(account, ACCOUNT_WINDOW_SECONDS);
    return count;
  }

  /** The right password: this visitor's count goes, and its network is known to the account. */
  async succeeded(email: string, ip: string): Promise<void> {
    await this.redis
      .multi()
      .del(this.visitorKey(email, ip))
      .set(this.knownKey(email, ip), '1', 'EX', KNOWN_SECONDS)
      .exec();
  }
}

/**
 * An address as it may appear in a log: a short fingerprint, enough to see
 * one address tried many times, without writing down what was typed.
 */
export const emailFingerprint = (email: string): string =>
  createHash('sha256').update(email.trim().toLowerCase()).digest('hex').slice(0, 12);
