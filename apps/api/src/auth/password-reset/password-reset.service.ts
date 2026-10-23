import { createHash, randomBytes } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import type { PasswordResetConfirmRequest, PasswordResetRequest } from '@pkg/contracts';
import { k } from '@pkg/locales';
import { IamService, InjectLogger, PinoLogger, SECURITY_CONFIG } from '@pkg/server';
import { LoginAttempts } from '../login-attempts.js';
import { MailService } from '../../mail/mail.service.js';
import { PasswordResetRepository } from './password-reset.repository.js';
import { resetEmail } from './reset-email.js';

/** How long a link is good for. */
export const RESET_LINK_MINUTES = 60;
/** Reset emails one account may be sent in any 24 hours. */
export const RESET_EMAILS_PER_DAY = 5;

const DAY_MS = 24 * 60 * 60 * 1000;
/** Rows older than this serve neither a link nor the daily count. */
const FORGET_AFTER_MS = 7 * DAY_MS;

const hashOf = (token: string): string => createHash('sha256').update(token).digest('hex');

/**
 * Where the link in the email opens: the web app's reset page. The token
 * rides in the FRAGMENT (`#`), which a browser never sends to a server, so it
 * stays out of proxy logs and out of the Referer header.
 */
export function resetLink(webAppUrl: string, token: string): string {
  return `${webAppUrl.replace(/\/+$/, '')}/auth/reset-password#token=${token}`;
}

/**
 * "I forgot my password", from the request to the new password.
 *
 * What keeps it safe, in the order an attacker would try it:
 *
 *  - **It never says whether an address has an account.** `request` returns
 *    nothing either way, and the controller does not even wait for it, so the
 *    answer takes the same time for a stranger's address as for a real one.
 *  - **It cannot be used to flood a mailbox.** One account is sent at most
 *    `RESET_EMAILS_PER_DAY` a day; the route itself is limited per address.
 *  - **The link is a 256-bit random token**, kept only as a hash, good once
 *    and for an hour. Using any link closes all of the account's links.
 *  - **A changed password ends every session** the account has, so somebody
 *    who was already in is put out by the owner taking the account back.
 *  - **A disabled account stays shut**: a reset is not a way back in.
 */
@Injectable()
export class PasswordResetService {
  constructor(
    private readonly resets: PasswordResetRepository,
    private readonly mail: MailService,
    private readonly iamService: IamService,
    private readonly config: ConfigService,
    private readonly attempts: LoginAttempts,
    @InjectLogger() private readonly logger: PinoLogger,
  ) {}

  /** Whether this deployment can send the email at all. */
  get enabled(): boolean {
    return this.mail.isConfigured;
  }

  /**
   * Mail a link to the account that holds this address, if there is one.
   * Resolves the same way whatever happened; says what did only in the log,
   * and there only by account id.
   */
  async request(dto: PasswordResetRequest, now = new Date()): Promise<void> {
    if (!this.enabled) return;

    const account = await this.resets.findAccountByEmail(dto.email);
    if (!account || account.disabled) return;

    const sent = await this.resets.countSince(account.id, new Date(now.getTime() - DAY_MS));
    if (sent >= RESET_EMAILS_PER_DAY) {
      this.logger.warn({ userId: account.id }, 'Password reset not sent — daily limit reached');
      return;
    }

    const token = randomBytes(32).toString('base64url');
    await this.resets.create({
      userId: account.id,
      tokenHash: hashOf(token),
      expiresAt: new Date(now.getTime() + RESET_LINK_MINUTES * 60_000),
      forgetBefore: new Date(now.getTime() - FORGET_AFTER_MS),
    });

    const link = resetLink(this.config.get<string>('WEB_APP_URL', 'http://localhost:5173'), token);
    const delivered = await this.mail.send({
      to: account.email,
      ...resetEmail({ link, minutes: RESET_LINK_MINUTES, locale: dto.locale }),
    });
    this.logger.info({ userId: account.id, delivered }, 'Password reset requested');
  }

  /** Whether a link would still be accepted. */
  async check(token: string, now = new Date()): Promise<boolean> {
    return (await this.resets.findOpenUserId(hashOf(token), now)) !== null;
  }

  /** Set the new password with a link, and end every session of the account. */
  async confirm(dto: PasswordResetConfirmRequest, now = new Date()): Promise<void> {
    const tokenHash = hashOf(dto.token);
    const userId = await this.resets.findOpenUserId(tokenHash, now);
    const account = userId ? await this.resets.findAccountById(userId) : null;
    if (!account || account.disabled) {
      throw new BadRequestException(k.auth.errors.resetLinkInvalid);
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, SECURITY_CONFIG.BCRYPT_ROUNDS);
    const changed = await this.resets.consume(tokenHash, passwordHash, now);
    // Lost a race with the same link: it was good a moment ago and is used now.
    if (!changed) throw new BadRequestException(k.auth.errors.resetLinkInvalid);

    await this.iamService.auth.revokeAllForUser(account.id);
    // Wrong guesses made before the reset must not lock the owner out of the
    // password they have just set.
    await this.attempts.clear(account.email);

    this.logger.info({ userId: account.id }, 'Password reset and all sessions revoked');
  }
}
