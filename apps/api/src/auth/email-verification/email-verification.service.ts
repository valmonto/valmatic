import { createHash, randomBytes } from 'node:crypto';
import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  ActiveUser,
  ChangeUnverifiedEmailRequest,
  ChangeUnverifiedEmailResponse,
  EmailVerificationResendResponse,
} from '@pkg/contracts';
import { k } from '@pkg/locales';
import { InjectLogger, PinoLogger } from '@pkg/server';
import { MailService } from '../../mail/mail.service.js';
import { EmailVerificationRepository } from './email-verification.repository.js';
import { verifyEmail } from './verify-email.js';

/** How long a link is good for. Longer than a reset link: nothing is at stake if it leaks but a tick. */
export const VERIFY_LINK_DAYS = 7;
/** Links one account may be mailed in any 24 hours. */
export const VERIFY_EMAILS_PER_DAY = 5;

const DAY_MS = 24 * 60 * 60 * 1000;
const hashOf = (token: string): string => createHash('sha256').update(token).digest('hex');

/** Where the link opens: the web app's page. The token rides in the fragment. */
export function verifyLink(webAppUrl: string, token: string): string {
  return `${webAppUrl.replace(/\/+$/, '')}/auth/verify-email#token=${token}`;
}

/**
 * Confirming a user's email address.
 *
 * Why it exists: an address is the only way back into an account whose
 * password is forgotten. A typo at sign-up — `gmial.com` — makes that
 * impossible, and the user finds out only when they need it. So the address
 * is mailed a link, the app shows the address until the link is opened, and
 * while nobody has opened one the user may correct it.
 *
 * It blocks nothing: the account works before the link is opened.
 */
@Injectable()
export class EmailVerificationService {
  constructor(
    private readonly verifications: EmailVerificationRepository,
    private readonly mail: MailService,
    private readonly config: ConfigService,
    @InjectLogger() private readonly logger: PinoLogger,
  ) {}

  /**
   * Mail a link to the address the account has now. False when nothing was
   * sent: no mail service, the daily limit, or nothing left to confirm.
   */
  async send(userId: string, locale: string | undefined, now = new Date()): Promise<boolean> {
    if (!this.mail.isConfigured) return false;
    const account = await this.verifications.findAccount(userId);
    if (!account || account.verified || account.disabled) return false;

    const sent = await this.verifications.countSince(userId, new Date(now.getTime() - DAY_MS));
    if (sent >= VERIFY_EMAILS_PER_DAY) {
      this.logger.warn({ userId }, 'Verification email not sent — daily limit reached');
      return false;
    }

    const token = randomBytes(32).toString('base64url');
    await this.verifications.create({
      userId,
      email: account.email,
      tokenHash: hashOf(token),
      expiresAt: new Date(now.getTime() + VERIFY_LINK_DAYS * DAY_MS),
      forgetBefore: new Date(now.getTime() - VERIFY_LINK_DAYS * DAY_MS),
    });
    const delivered = await this.mail.send({
      to: account.email,
      ...verifyEmail({
        link: verifyLink(this.config.get<string>('WEB_APP_URL', 'http://localhost:5173'), token),
        days: VERIFY_LINK_DAYS,
        locale,
      }),
    });
    this.logger.info({ userId, delivered }, 'Verification email sent');
    return delivered;
  }

  /** "Send it again", from the signed-in user. */
  async resend(
    activeUser: ActiveUser,
    locale: string | undefined,
  ): Promise<EmailVerificationResendResponse> {
    return { sent: await this.send(activeUser.userId, locale) };
  }

  /** Open a link. Public: it may be opened in a browser that is signed in to nothing. */
  async confirm(token: string, now = new Date()): Promise<string> {
    const email = await this.verifications.consume(hashOf(token), now);
    if (!email) throw new BadRequestException(k.auth.errors.verifyLinkInvalid);
    this.logger.info('Email address confirmed');
    return email;
  }

  /**
   * Correct an address nobody has confirmed, and mail the link there. Only
   * the signed-in user's own account, and only while it is unconfirmed.
   */
  async changeUnverified(
    activeUser: ActiveUser,
    dto: ChangeUnverifiedEmailRequest,
    now = new Date(),
  ): Promise<ChangeUnverifiedEmailResponse> {
    const account = await this.verifications.findAccount(activeUser.userId);
    if (!account || account.disabled) throw new ForbiddenException();
    if (account.verified) throw new BadRequestException(k.auth.errors.emailAlreadyVerified);

    const email = dto.email.toLowerCase();
    // Generic on purpose: saying the address belongs to someone would tell a
    // caller who has an account.
    if (!(await this.verifications.changeUnverified(account.id, email, now))) {
      throw new BadRequestException(k.auth.errors.unableToChangeEmail);
    }
    this.logger.info({ userId: account.id }, 'Unconfirmed email address changed');
    await this.send(account.id, dto.locale, now);
    return { email };
  }
}
