import { BadRequestException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { ActiveUser } from '@pkg/contracts';
import { FakeLogger } from '@pkg/testing';
import type { PinoLogger } from 'nestjs-pino';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MailService } from '@/mail/mail.service.js';
import type { EmailVerificationRepository } from '@/auth/email-verification/email-verification.repository.js';
import {
  EmailVerificationService,
  VERIFY_EMAILS_PER_DAY,
  verifyLink,
} from '@/auth/email-verification/email-verification.service.js';

type Fn = ReturnType<typeof vi.fn>;

const someone: ActiveUser = {
  orgId: '00000000-0000-4000-8000-00000000000a',
  userId: '00000000-0000-4000-8000-0000000000e1',
  orgRole: 'MEMBER',
  systemRole: 'USER',
};
const unconfirmed = {
  id: someone.userId,
  email: 'jonas@gmial.com',
  verified: false,
  disabled: false,
};

describe('EmailVerificationService', () => {
  let service: EmailVerificationService;
  let repo: Record<string, Fn>;
  let mail: { isConfigured: boolean; send: Fn };

  beforeEach(() => {
    repo = {
      findAccount: vi.fn().mockResolvedValue(unconfirmed),
      countSince: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockResolvedValue(undefined),
      consume: vi.fn().mockResolvedValue('jonas@gmail.com'),
      changeUnverified: vi.fn().mockResolvedValue(true),
    };
    mail = { isConfigured: true, send: vi.fn().mockResolvedValue(true) };
    service = new EmailVerificationService(
      repo as unknown as EmailVerificationRepository,
      mail as unknown as MailService,
      {
        get: (key: string) => (key === 'WEB_APP_URL' ? 'https://site.test/' : undefined),
      } as unknown as ConfigService,
      new FakeLogger().as<PinoLogger>(),
    );
  });

  it("opens the web app's page, the token in the fragment", () => {
    expect(verifyLink('https://site.test/', 'tok')).toBe(
      'https://site.test/auth/verify-email#token=tok',
    );
  });

  it('mails a link to the address the account has, keeping only its hash', async () => {
    expect(await service.send(someone.userId, 'lt')).toBe(true);

    const [stored] = repo['create']!.mock.calls[0] as [{ email: string; tokenHash: string }];
    expect(stored.email).toBe('jonas@gmial.com');
    const sent = mail.send.mock.calls[0]![0] as { to: string; text: string };
    expect(sent.to).toBe('jonas@gmial.com');
    const token = /#token=([\w-]+)/.exec(sent.text)![1]!;
    // The stored value is a hash, not the token that went out.
    expect(stored.tokenHash).not.toContain(token);
    expect(stored.tokenHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('sends nothing when the address is confirmed, the limit is reached, or there is no mail', async () => {
    repo['findAccount']!.mockResolvedValueOnce({ ...unconfirmed, verified: true });
    expect(await service.send(someone.userId, 'lt')).toBe(false);

    repo['countSince']!.mockResolvedValueOnce(VERIFY_EMAILS_PER_DAY);
    expect(await service.send(someone.userId, 'lt')).toBe(false);

    mail.isConfigured = false;
    expect(await service.send(someone.userId, 'lt')).toBe(false);
    expect(mail.send).not.toHaveBeenCalled();
  });

  it('answers a dead link with the same refusal, whatever made it dead', async () => {
    repo['consume']!.mockResolvedValue(null);
    await expect(service.confirm('x'.repeat(43))).rejects.toBeInstanceOf(BadRequestException);
  });

  it('corrects an unconfirmed address (lower-cased) and mails the link there', async () => {
    repo['findAccount']!.mockResolvedValueOnce(unconfirmed).mockResolvedValueOnce({
      ...unconfirmed,
      email: 'jonas@gmail.com',
    });

    const result = await service.changeUnverified(someone, { email: 'Jonas@Gmail.com' });

    expect(result).toEqual({ email: 'jonas@gmail.com' });
    expect(repo['changeUnverified']).toHaveBeenCalledWith(
      someone.userId,
      'jonas@gmail.com',
      expect.any(Date),
    );
    expect(mail.send.mock.calls[0]![0].to).toBe('jonas@gmail.com');
  });

  it('refuses to change a confirmed address, or one somebody else holds', async () => {
    repo['findAccount']!.mockResolvedValueOnce({ ...unconfirmed, verified: true });
    await expect(service.changeUnverified(someone, { email: 'a@b.lt' })).rejects.toBeInstanceOf(
      BadRequestException,
    );

    repo['changeUnverified']!.mockResolvedValueOnce(false);
    await expect(service.changeUnverified(someone, { email: 'taken@b.lt' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(mail.send).not.toHaveBeenCalled();
  });
});
