import {
  defaultLanguage,
  k,
  supportedLanguages,
  translations,
  type SupportedLanguage,
} from '@pkg/locales';

/**
 * The "choose a new password" email.
 *
 * Plain on purpose — a few lines and one link. No tracking, no pictures: a
 * message that looks like a newsletter is the one a mail filter throws away,
 * and this is the message a locked-out user is waiting for.
 *
 * The words come from @pkg/locales (`email.resetPassword.*`), in the language
 * the request named; an unknown one gets the default language.
 */
export function languageOf(locale: string | undefined): SupportedLanguage {
  const code = locale?.split(/[-_]/)[0]?.toLowerCase();
  return supportedLanguages.find((l) => l === code) ?? defaultLanguage;
}

export const escapeHtml = (text: string): string =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

export function resetEmail(input: { link: string; minutes: number; locale: string | undefined }): {
  subject: string;
  text: string;
  html: string;
} {
  const words = translations[languageOf(input.locale)] as Record<string, string>;
  const say = (key: string): string => words[key] ?? key;
  const expiry = say(k.email.resetPassword.expiry).replace('{{minutes}}', String(input.minutes));
  const intro = say(k.email.resetPassword.intro);
  const button = say(k.email.resetPassword.button);
  const ignore = say(k.email.resetPassword.ignore);
  const link = escapeHtml(input.link);

  return {
    subject: say(k.email.resetPassword.subject),
    text: [intro, '', `${button}:`, input.link, '', expiry, ignore].join('\n'),
    html: [
      '<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:16px;line-height:1.5;color:#111;max-width:480px">',
      `<p>${escapeHtml(intro)}</p>`,
      `<p><a href="${link}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#111;color:#fff;text-decoration:none;font-weight:600">${escapeHtml(button)}</a></p>`,
      `<p style="font-size:14px;color:#555">${escapeHtml(expiry)}<br>${escapeHtml(ignore)}</p>`,
      `<p style="font-size:12px;color:#888;word-break:break-all">${link}</p>`,
      '</div>',
    ].join(''),
  };
}
