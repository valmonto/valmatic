import type { ConfigService } from '@nestjs/config';
import { FakeLogger } from '@pkg/testing';
import type { PinoLogger } from 'nestjs-pino';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MailService } from '@/mail/mail.service.js';

const MAIL = { to: 'someone@example.com', subject: 'S', text: 'T', html: '<p>T</p>' };

describe('MailService', () => {
  let env: Record<string, string | undefined>;
  let logger: FakeLogger;
  let fetchMock: ReturnType<typeof vi.fn>;
  let service: MailService;

  beforeEach(() => {
    env = {
      RESEND_API_KEY: 're_test_key',
      MAIL_FROM: 'Valmatic <no-reply@example.test>',
      RESEND_API_URL: 'https://mail.example.test',
    };
    logger = new FakeLogger();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.useFakeTimers();
    service = new MailService(
      { get: (key: string) => env[key] } as unknown as ConfigService,
      logger as unknown as PinoLogger,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('is off without a key or without a sender, and then sends nothing', async () => {
    env.MAIL_FROM = undefined;
    expect(service.isConfigured).toBe(false);
    expect(await service.send(MAIL)).toBe(false);

    env.MAIL_FROM = 'Valmatic <no-reply@example.test>';
    env.RESEND_API_KEY = undefined;
    expect(service.isConfigured).toBe(false);
    expect(await service.send(MAIL)).toBe(false);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts the message with the key as a bearer token', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 });

    expect(await service.send(MAIL)).toBe(true);

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://mail.example.test/emails');
    expect(init.headers.authorization).toBe('Bearer re_test_key');
    expect(JSON.parse(init.body)).toEqual({
      from: 'Valmatic <no-reply@example.test>',
      to: ['someone@example.com'],
      subject: 'S',
      text: 'T',
      html: '<p>T</p>',
    });
  });

  it('does not ask again when the refusal is our own mistake', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 403 });

    expect(await service.send(MAIL)).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('asks again when the service is down, and gives up after three tries', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503 });

    const sending = service.send(MAIL);
    await vi.runAllTimersAsync();

    expect(await sending).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('gets through on a later try, and never throws on a network failure', async () => {
    fetchMock
      .mockRejectedValueOnce(new Error('connection reset'))
      .mockResolvedValueOnce({ ok: true, status: 200 });

    const sending = service.send(MAIL);
    await vi.runAllTimersAsync();

    expect(await sending).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('logs neither the address nor the message', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 403 });
    await service.send({ ...MAIL, text: 'https://app/auth/reset-password#token=SECRET' });

    const logged = JSON.stringify(logger);
    expect(logged).not.toContain('someone@example.com');
    expect(logged).not.toContain('SECRET');
    expect(logged).not.toContain('re_test_key');
  });
});
