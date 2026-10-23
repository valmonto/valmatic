import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Optional,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AUTH_IDENTITY_PROVIDERS,
  type ActiveUser,
  type AuthIdentityProvider,
  type ProviderNonceResponse,
  type ProviderProof,
  type ProviderSignInRequest,
  type ProviderSignInResponse,
} from '@pkg/contracts';
import type { User } from '@pkg/database';
import { IamService, InjectLogger, PinoLogger } from '@pkg/server';
import { k } from '@pkg/locales';
import { AuthRepository } from '../auth.repository.js';
import { MULTI_ORG } from '../../org/multi-org.js';
import { AuthProviderRepository } from './auth-provider.repository.js';
import { IdentityTokenVerifier, type VerifiedIdentity } from './identity-token.verifier.js';
import { ProviderTokens } from './provider-tokens.js';

/**
 * The password hash of an account made through a provider: not a bcrypt
 * hash, so no password matches it. A password reset can set a real one.
 */
export const NO_PASSWORD = '!provider';

/** Why a provider token was not accepted. The reason goes to the log only. */
export class ProviderProofRejected extends Error {}

type SignInResult = {
  response: ProviderSignInResponse;
  accessToken: string;
  refreshToken: string;
};

/**
 * Signing in with Apple or Google.
 *
 * In this order, and the order is the point:
 *
 *  1. **Verify.** The token's signature, issuer, audience and expiry are
 *     checked, then it is spent: a nonce must be ours and unused, and no
 *     token works twice. Until then the request is an anonymous string.
 *  2. **Find.** A known `(provider, subject)` signs that account in.
 *  3. **Link.** An unknown one whose address the PROVIDER verified, and that
 *     an account already holds, is linked to that account — so someone who
 *     signed up by email and later taps "Continue with Google" keeps one
 *     account. Never a platform admin's: those sign in with their password.
 *  4. **Create.** Otherwise, when sign-up is open, a new account placed as
 *     `POST /auth/register` places one (`placeNewAccount`).
 *
 * Nothing the client says about itself is used for any of it. `fullName` only
 * names a new account, because Apple gives the name to the app and never to us.
 */
@Injectable()
export class AuthProviderService {
  constructor(
    private readonly verifier: IdentityTokenVerifier,
    private readonly tokens: ProviderTokens,
    private readonly identities: AuthProviderRepository,
    private readonly authRepository: AuthRepository,
    private readonly iamService: IamService,
    private readonly configService: ConfigService,
    @InjectLogger() private readonly logger: PinoLogger,
    @Optional() @Inject(MULTI_ORG) private readonly multiOrg?: boolean,
  ) {}

  /** The providers this deployment can verify. */
  available(): AuthIdentityProvider[] {
    return AUTH_IDENTITY_PROVIDERS.filter((provider) => this.verifier.isConfigured(provider));
  }

  /** A one-time value for the app to give the provider before it signs in. */
  async nonce(): Promise<ProviderNonceResponse> {
    return { nonce: await this.tokens.issueNonce() };
  }

  async signIn(dto: ProviderSignInRequest): Promise<SignInResult> {
    let verified: VerifiedIdentity;
    try {
      verified = await this.verify(dto);
    } catch (error) {
      if (!(error instanceof ProviderProofRejected)) throw error;
      // One answer for every failure: which check failed helps only a prober.
      throw new UnauthorizedException(k.auth.errors.providerTokenInvalid);
    }

    const existing = await this.identities.findIdentity(verified.provider, verified.subject);
    if (existing) {
      await this.identities.touch(existing.identity.id);
      return this.issue(existing.user, false);
    }

    const holder = verified.email ? await this.identities.findUserByEmail(verified.email) : null;
    if (holder && verified.emailVerified) {
      if (holder.systemRole !== 'USER') {
        // A provider login to a platform admin's mailbox must not become a
        // way into the platform without the admin's password.
        this.logger.warn(
          { provider: verified.provider, userId: holder.id },
          'Provider sign-in refused — the address belongs to a platform admin',
        );
        throw new ConflictException(k.auth.errors.providerNotForPlatformAdmins);
      }
      const { claimed } = await this.identities.linkIdentity({
        userId: holder.id,
        provider: verified.provider,
        subject: verified.subject,
        email: verified.email,
        noPassword: NO_PASSWORD,
      });
      if (claimed) {
        await this.iamService.auth.revokeAllForUser(holder.id);
        this.logger.info(
          { userId: holder.id },
          'Unconfirmed account claimed by a provider: password and sessions dropped',
        );
      }
      this.logger.info(
        { provider: verified.provider, userId: holder.id },
        'Provider linked to an existing account',
      );
      return this.issue(holder, false);
    }

    if (this.configService.get<boolean>('AUTH_REGISTRATION_ENABLED') !== true) {
      throw new ForbiddenException(k.auth.errors.registrationDisabled);
    }
    // The address is taken but the provider does not vouch for it: linking
    // would hand the account to whoever made the token. Same answer sign-up
    // gives for a taken address.
    if (holder) throw new BadRequestException(k.auth.errors.unableToCreateAccount);

    const name = dto.fullName ?? verified.name ?? nameFrom(verified.email);
    const created = await this.identities.createAccount({
      // When a provider sends no address, the subject stands in, on the
      // reserved `.invalid` domain so it can never be a real person's.
      email: verified.email ?? `${verified.provider}-${verified.subject}@provider.invalid`,
      name,
      passwordHash: NO_PASSWORD,
      emailVerified: Boolean(verified.email && verified.emailVerified),
      organizationName: name,
      multiOrg: this.multiOrg === true,
      provider: verified.provider,
      subject: verified.subject,
      providerEmail: verified.email,
    });
    this.logger.info(
      { provider: verified.provider, userId: created.id },
      'Account created through a provider',
    );
    return this.issue(created, true);
  }

  /**
   * Whether a fresh provider sign-in proves the caller owns this account: a
   * valid, unused token whose subject is linked to it. For confirming acts
   * like deleting the account, where an account without a password has
   * nothing else to show. False rather than a 401: the session is fine.
   */
  async provesOwner(userId: string, proof: ProviderProof): Promise<boolean> {
    try {
      const verified = await this.verify(proof);
      const found = await this.identities.findIdentity(verified.provider, verified.subject);
      return found?.user.id === userId;
    } catch (error) {
      if (error instanceof ProviderProofRejected) return false;
      throw error;
    }
  }

  /** The token checked and spent. Throws `ProviderProofRejected`. */
  private async verify(proof: ProviderProof): Promise<VerifiedIdentity> {
    if (!this.verifier.isConfigured(proof.provider)) {
      // Not an auth failure: this deployment does not offer the provider,
      // and `GET /auth/options` said so.
      throw new ServiceUnavailableException(k.auth.errors.providerUnavailable);
    }

    let verified: VerifiedIdentity;
    try {
      verified = await this.verifier.verify(proof.provider, proof.identityToken);
    } catch (error) {
      this.logger.warn({ provider: proof.provider, err: error }, 'Identity token rejected');
      throw new ProviderProofRejected('signature');
    }

    // Apple always carries our nonce. A Google token carries one only when the
    // client could put it there (the web's sign-in can; the native sheet
    // cannot), and then it must be ours too.
    if (proof.provider === 'apple' || verified.nonce !== null) {
      if (!proof.nonce || verified.nonce !== proof.nonce) {
        this.logger.warn({ provider: proof.provider }, 'Identity token refused — nonce missing');
        throw new ProviderProofRejected('nonce');
      }
      if (!(await this.tokens.takeNonce(proof.nonce))) {
        this.logger.warn({ provider: proof.provider }, 'Identity token refused — nonce not ours');
        throw new ProviderProofRejected('nonce');
      }
    }
    if (!(await this.tokens.firstUse(proof.identityToken, verified.expiresAt))) {
      this.logger.warn({ provider: proof.provider }, 'Identity token refused — already used');
      throw new ProviderProofRejected('replay');
    }
    return verified;
  }

  private async issue(account: User, created: boolean): Promise<SignInResult> {
    // The provider has vouched for who is asking, so this is safe to say —
    // the same answer the password login gives once the password matched.
    if (account.disabledAt) {
      this.logger.warn({ userId: account.id }, 'Provider sign-in refused — account disabled');
      throw new ForbiddenException(k.auth.errors.accountDisabled);
    }
    const membership = await this.authRepository.findFirstOrgForUser(account.id);
    if (!membership) throw new UnauthorizedException(k.auth.errors.noOrgAccess);

    const activeUser: ActiveUser = {
      orgId: membership.orgId,
      userId: account.id,
      orgRole: membership.role,
      systemRole: account.systemRole,
    };
    const tokens = await this.iamService.auth.issueTokens(activeUser);
    return {
      response: { user: { id: account.id, email: account.email, name: account.name }, created },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }
}

/** A last-resort name: the address's local part, or a plain word. */
function nameFrom(email: string | null): string {
  const local = email?.split('@')[0]?.trim();
  return local && local.length > 0 ? local : 'User';
}
