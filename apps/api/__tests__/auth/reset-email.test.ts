import { describe, expect, it } from 'vitest';
import { languageOf, resetEmail } from '@/auth/password-reset/reset-email.js';

describe('resetEmail', () => {
  const link = 'https://app.example.test/auth/reset-password#token=a<b';

  it('writes the email in the requested language, with the minutes filled in', () => {
    const mail = resetEmail({ link, minutes: 60, locale: 'es-ES' });
    expect(mail.subject).toBe('Elige una nueva contraseña');
    expect(mail.text).toContain('60 minutos');
    expect(mail.text).toContain(link);
  });

  it('falls back to the default language for one it does not have', () => {
    expect(languageOf('xx')).toBe('en');
    expect(languageOf(undefined)).toBe('en');
    expect(resetEmail({ link, minutes: 60, locale: 'xx' }).subject).toBe('Choose a new password');
  });

  // The link is the only thing in the email that did not come from us.
  it('escapes the link in the HTML part', () => {
    const { html } = resetEmail({ link, minutes: 60, locale: 'en' });
    expect(html).toContain('token=a&lt;b');
    expect(html).not.toContain('token=a<b');
  });
});
