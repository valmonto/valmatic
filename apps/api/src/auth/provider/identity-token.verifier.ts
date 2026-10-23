import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import type { AuthIdentityProvider } from '@pkg/contracts';

/**
 * What a verified identity token amounts to.
 *
 * `subject` is the provider's own stable id for the person — the only field
 * that is identity. `email` is whatever the provider chose to include and may
 * be a relay address, absent, or different on the next sign-in; nothing keys
 * on it.
 */
export interface VerifiedIdentity {
  provider: AuthIdentityProvider;
  subject: string;
  email: string | null;
  emailVerified: boolean;
  /** Google puts a display name in the token; Apple never does. */
  name: string | null;
  /** The `nonce` claim, when the sign-in carried one. */
  nonce: string | null;
  /** When the token stops being valid, in seconds since the epoch. */
  expiresAt: number;
}

interface ProviderConfig {
  issuer: string;
  jwksUri: string;
  /** Every client id this deployment accepts a token for. */
  audiences: string[];
}

/**
 * Turning a provider's identity token into a subject we are willing to trust.
 *
 * The whole security of Sign in with Apple / Google is here: the token arrives
 * from the client, so **nothing in it counts until the signature has been
 * checked against the provider's own published keys**. `jose` does the work —
 * signature, `iss`, `aud` and expiry in one call — and `createRemoteJWKSet`
 * caches and rotates the key set, which matters because both providers roll
 * keys without notice and a hand-rolled fetch-once cache breaks silently on
 * the day they do.
 *
 * Audience is checked against the client ids this deployment is configured
 * with, not against anything in the request. Without that check any token
 * Apple ever signed — including one minted for an unrelated app — would sign
 * somebody in here.
 *
 * A provider with no client id configured is not verifiable, and
 * `isConfigured` says so rather than the code guessing: `GET /auth/options`
 * reads it, the app hides the button, and the endpoint refuses.
 */
@Injectable()
export class IdentityTokenVerifier {
  /** One key set per provider, kept for the life of the process. */
  private readonly keySets = new Map<AuthIdentityProvider, ReturnType<typeof createRemoteJWKSet>>();

  constructor(private readonly configService: ConfigService) {}

  private configFor(provider: AuthIdentityProvider): ProviderConfig | null {
    // Several client ids per provider: iOS, Android and web each get their own
    // OAuth client from Google, and all three sign in the same person.
    const raw = this.configService.get<string>(
      provider === 'apple' ? 'AUTH_APPLE_CLIENT_ID' : 'AUTH_GOOGLE_CLIENT_ID',
    );
    const audiences = (raw ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    if (audiences.length === 0) return null;

    return provider === 'apple'
      ? {
          issuer: 'https://appleid.apple.com',
          jwksUri: 'https://appleid.apple.com/auth/keys',
          audiences,
        }
      : {
          issuer: 'https://accounts.google.com',
          jwksUri: 'https://www.googleapis.com/oauth2/v3/certs',
          audiences,
        };
  }

  /** Whether this deployment can accept tokens from a provider at all. */
  isConfigured(provider: AuthIdentityProvider): boolean {
    return this.configFor(provider) !== null;
  }

  private keySetFor(provider: AuthIdentityProvider, config: ProviderConfig) {
    let keySet = this.keySets.get(provider);
    if (!keySet) {
      keySet = createRemoteJWKSet(new URL(config.jwksUri));
      this.keySets.set(provider, keySet);
    }
    return keySet;
  }

  /**
   * Verify a token and return what it proves. Throws on anything short of a
   * good signature from the right issuer for one of our client ids — the
   * caller turns that into one generic refusal, because telling a caller
   * which check failed helps only the caller who is probing.
   */
  async verify(provider: AuthIdentityProvider, identityToken: string): Promise<VerifiedIdentity> {
    const config = this.configFor(provider);
    if (!config) throw new Error(`Provider ${provider} is not configured`);

    const { payload } = await jwtVerify(identityToken, this.keySetFor(provider, config), {
      issuer: config.issuer,
      audience: config.audiences,
    });

    const subject = payload.sub;
    if (!subject) throw new Error('Identity token carries no subject');
    // Both providers always set it; a token without one would never expire.
    if (typeof payload.exp !== 'number') throw new Error('Identity token carries no expiry');

    return {
      provider,
      subject,
      email: readEmail(payload),
      emailVerified: readEmailVerified(payload),
      name: readName(payload),
      nonce: typeof payload['nonce'] === 'string' ? payload['nonce'] : null,
      expiresAt: payload.exp,
    };
  }
}

function readName(payload: JWTPayload): string | null {
  const name = payload['name'];
  return typeof name === 'string' && name.trim().length > 0 ? name.trim() : null;
}

function readEmail(payload: JWTPayload): string | null {
  const email = payload['email'];
  return typeof email === 'string' && email.length > 0 ? email.toLowerCase() : null;
}

/**
 * Both providers send this as a boolean OR the string `"true"` depending on
 * the endpoint and the day; Apple has shipped both. Read it permissively and
 * default to false — an unverified address is only ever used for display, so
 * being wrong in this direction costs nothing.
 */
function readEmailVerified(payload: JWTPayload): boolean {
  const value = payload['email_verified'];
  return value === true || value === 'true';
}
