import { k, translations } from '@pkg/locales';
import { escapeHtml, languageOf } from '../password-reset/reset-email.js';

/**
 * The "confirm your email address" email. Plain like the reset email: a few
 * lines and one link, no pictures, no tracking. The words come from
 * @pkg/locales (`email.verifyEmail.*`) in the requested language.
 */
export function verifyEmail(input: { link: string; days: number; locale: string | undefined }): {
  subject: string;
  text: string;
  html: string;
} {
  const words = translations[languageOf(input.locale)] as Record<string, string>;
  const say = (key: string): string => words[key] ?? key;
  const intro = say(k.email.verifyEmail.intro);
  const button = say(k.email.verifyEmail.button);
  const why = say(k.email.verifyEmail.why).replace('{{days}}', String(input.days));
  const ignore = say(k.email.verifyEmail.ignore);
  const link = escapeHtml(input.link);

  return {
    subject: say(k.email.verifyEmail.subject),
    text: [intro, '', `${button}:`, input.link, '', why, ignore].join('\n'),
    html: [
      '<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:16px;line-height:1.5;color:#111;max-width:480px">',
      `<p>${escapeHtml(intro)}</p>`,
      `<p><a href="${link}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#111;color:#fff;text-decoration:none;font-weight:600">${escapeHtml(button)}</a></p>`,
      `<p style="font-size:14px;color:#555">${escapeHtml(why)}<br>${escapeHtml(ignore)}</p>`,
      `<p style="font-size:12px;color:#888;word-break:break-all">${link}</p>`,
      '</div>',
    ].join(''),
  };
}
