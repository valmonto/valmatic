import type { ConfigService } from '@nestjs/config';
import { SignJWT, exportJWK, generateKeyPair } from 'jose';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { IdentityTokenVerifier } from '@/auth/provider/identity-token.verifier.js';

/**
 * The real `jose` check against a key set served from memory: the provider's
 * key-set address is answered by a stubbed `fetch`, and the tokens are signed
 * here with a key that set holds — or with one it does not.
 */
describe('IdentityTokenVerifier', () => {
  let signingKey: CryptoKey;
  let strangerKey: CryptoKey;
  let jwks: { keys: unknown[] };
  const now = () => Math.floor(Date.now() / 1000);

  beforeAll(async () => {
    const pair = await generateKeyPair('RS256', { extractable: true });
    signingKey = pair.privateKey;
    strangerKey = (await generateKeyPair('RS256')).privateKey;
    jwks = { keys: [{ ...(await exportJWK(pair.publicKey)), kid: 'k1', alg: 'RS256' }] };
  });

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify(jwks), { headers: { 'content-type': 'application/json' } }),
      ),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  const verifier = (ids: Record<string, string | undefined>) =>
    new IdentityTokenVerifier({ get: (key: string) => ids[key] } as unknown as ConfigService);

  const token = (claims: Record<string, unknown>, key = signingKey) =>
    new SignJWT({ email: 'Person@Example.com', email_verified: 'true', ...claims })
      .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
      .setIssuer('https://accounts.google.com')
      .setAudience('web-client')
      .setSubject('sub-1')
      .setIssuedAt()
      .setExpirationTime(typeof claims.exp === 'number' ? claims.exp : now() + 600)
      .sign(key);

  it('is off for a provider with no client id', () => {
    const v = verifier({ AUTH_GOOGLE_CLIENT_ID: 'web-client' });
    expect(v.isConfigured('google')).toBe(true);
    expect(v.isConfigured('apple')).toBe(false);
  });

  it('accepts a token signed by the provider for one of our client ids', async () => {
    const v = verifier({ AUTH_GOOGLE_CLIENT_ID: 'ios-client, web-client' });
    const out = await v.verify('google', await token({ nonce: 'n1', name: ' Person ' }));
    expect(out).toMatchObject({
      provider: 'google',
      subject: 'sub-1',
      email: 'person@example.com',
      emailVerified: true,
      name: 'Person',
      nonce: 'n1',
    });
  });

  it('refuses a token made for another app', async () => {
    const v = verifier({ AUTH_GOOGLE_CLIENT_ID: 'our-client' });
    await expect(v.verify('google', await token({}))).rejects.toThrow();
  });

  it('refuses a token not signed with the provider’s key', async () => {
    const v = verifier({ AUTH_GOOGLE_CLIENT_ID: 'web-client' });
    await expect(v.verify('google', await token({}, strangerKey))).rejects.toThrow();
  });

  it('refuses an expired token', async () => {
    const v = verifier({ AUTH_GOOGLE_CLIENT_ID: 'web-client' });
    await expect(v.verify('google', await token({ exp: now() - 120 }))).rejects.toThrow();
  });

  it('refuses a Google token as an Apple one (wrong issuer)', async () => {
    const v = verifier({ AUTH_APPLE_CLIENT_ID: 'web-client' });
    await expect(v.verify('apple', await token({}))).rejects.toThrow();
  });
});
