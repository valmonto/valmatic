import { Inject, Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import type { Redis } from 'ioredis';
import { IAM_REDIS } from '@pkg/server';

/** How long a handed-out nonce waits for its sign-in. */
const NONCE_SECONDS = 10 * 60;

/**
 * What keeps a copied Apple or Google token from signing anyone in.
 *
 * Two checks, both in Redis:
 *
 *  - **Each token is used once.** Its first use is recorded until the token
 *    itself expires; the same token again is refused. A token lifted from a
 *    log or a proxy after it was used is worth nothing.
 *  - **A nonce in a token must be one we handed out, once.** The app asks for
 *    a nonce, gives it to the provider, and the provider signs it into the
 *    token. A token made for a sign-in this server did not start has no nonce
 *    of ours and is refused. Apple always carries one; Google's native sheet
 *    cannot, so a Google token without one relies on the first check alone.
 *
 * Only hashes of tokens are kept, never the tokens.
 */
@Injectable()
export class ProviderTokens {
  constructor(@Inject(IAM_REDIS) private readonly redis: Redis) {}

  /** A fresh nonce, good for one sign-in within ten minutes. */
  async issueNonce(): Promise<string> {
    const nonce = randomBytes(32).toString('base64url');
    await this.redis.set(nonceKey(nonce), '1', 'EX', NONCE_SECONDS);
    return nonce;
  }

  /** Whether this nonce was handed out and not yet used; asking spends it. */
  async takeNonce(nonce: string): Promise<boolean> {
    return (await this.redis.del(nonceKey(nonce))) === 1;
  }

  /** Record a token's first use. False when it was used before. */
  async firstUse(identityToken: string, expiresAt: number): Promise<boolean> {
    const seconds = Math.max(1, Math.ceil(expiresAt - Date.now() / 1000));
    const stored = await this.redis.set(tokenKey(identityToken), '1', 'EX', seconds, 'NX');
    return stored === 'OK';
  }
}

function nonceKey(nonce: string): string {
  return `iam:provider-nonce:${nonce}`;
}

function tokenKey(identityToken: string): string {
  return `iam:provider-token:${createHash('sha256').update(identityToken).digest('hex')}`;
}
