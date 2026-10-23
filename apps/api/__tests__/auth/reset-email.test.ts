import { defaultLanguage, k, supportedLanguages, translations } from '@pkg/locales';
import { describe, expect, it } from 'vitest';
import { languageOf, resetEmail } from '@/auth/password-reset/reset-email.js';

describe('resetEmail', () => {
  const link = 'https://app.example.test/auth/reset-password#token=a<b';

  // Each language the project keeps (valmatic.json), by its own texts.
  const subjectIn = (lang: (typeof supportedLanguages)[number]): string =>
    (translations[lang] as Record<string, string>)[k.email.resetPassword.subject]!;

  it.each(supportedLanguages)('writes the email in %s, with the minutes filled in', (lang) => {
    const mail = resetEmail({ link, minutes: 60, locale: `${lang}-XX` });
    expect(mail.subject).toBe(subjectIn(lang));
    expect(mail.text).toContain('60');
    expect(mail.text).toContain(link);
  });

  it('falls back to the default language for one it does not have', () => {
    expect(languageOf('xx')).toBe(defaultLanguage);
    expect(languageOf(undefined)).toBe(defaultLanguage);
    expect(resetEmail({ link, minutes: 60, locale: 'xx' }).subject).toBe(
      subjectIn(defaultLanguage),
    );
  });

  // The link is the only thing in the email that did not come from us.
  it('escapes the link in the HTML part', () => {
    const { html } = resetEmail({ link, minutes: 60, locale: 'en' });
    expect(html).toContain('token=a&lt;b');
    expect(html).not.toContain('token=a<b');
  });
});
