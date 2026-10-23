import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectLogger, PinoLogger } from '@pkg/server';

export interface OutgoingMail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/** How long one attempt may take before it is given up on. */
const SEND_TIMEOUT_MS = 10_000;
/** Attempts in all. A reset email nobody receives is a locked-out user. */
const ATTEMPTS = 3;

/**
 * Sending an email, through Resend's HTTP API.
 *
 * To use another provider (SES, Postmark, SMTP), replace this class's `send`
 * — or provide a different class as `MailService` in `mail.module.ts`. The
 * callers only use `isConfigured` and `send`.
 *
 * It is a plain `fetch`, not their SDK: one POST is all that is used, and a
 * dependency for it would be one more thing to keep current.
 *
 * WHY THIS IS NOT A QUEUE JOB. Every other slow thing here goes through the
 * worker. A reset email carries a link that changes a password, and a job's
 * payload sits in Redis and is shown on the dashboard's Jobs page. So the
 * mail is sent from here, with its own few retries, and the link is never
 * written anywhere but the email itself.
 *
 * Nothing in a message is logged — not the address (it says who has an
 * account), not the body (it holds the link).
 */
@Injectable()
export class MailService {
  constructor(
    private readonly config: ConfigService,
    @InjectLogger() private readonly logger: PinoLogger,
  ) {}

  /** Whether this deployment can send mail at all: a key AND a sender. */
  get isConfigured(): boolean {
    return Boolean(
      this.config.get<string>('RESEND_API_KEY') && this.config.get<string>('MAIL_FROM'),
    );
  }

  /**
   * Send one message. Resolves `true` when the mail service took it.
   *
   * Never throws: the caller has already answered its own request and has
   * nobody to tell. A failure is logged with the service's status only.
   */
  async send(mail: OutgoingMail): Promise<boolean> {
    if (!this.isConfigured) return false;

    const url = `${this.config.get<string>('RESEND_API_URL')}/emails`;
    const body = JSON.stringify({
      from: this.config.get<string>('MAIL_FROM'),
      to: [mail.to],
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });

    for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${this.config.get<string>('RESEND_API_KEY')}`,
            'content-type': 'application/json',
          },
          body,
          signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
        });
        if (response.ok) return true;

        // A 4xx other than "slow down" is our own mistake (a bad key, an
        // unverified sender): asking again gets the same answer.
        const retryable = response.status === 429 || response.status >= 500;
        this.logger.warn({ status: response.status, attempt }, 'Mail service refused a message');
        if (!retryable) return false;
      } catch (error) {
        this.logger.warn({ err: error, attempt }, 'Mail service could not be reached');
      }
      if (attempt < ATTEMPTS) await new Promise((resolve) => setTimeout(resolve, attempt * 1_000));
    }
    return false;
  }
}
