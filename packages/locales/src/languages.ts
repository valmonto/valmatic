/**
 * How each language names itself, for language pickers. Covers more than
 * the template ships so a project that adds a language (docs/addons.md,
 * "Languages") needs only its translation file.
 */
export const LANGUAGE_NAMES: Readonly<Record<string, { native: string; flag: string }>> = {
  en: { native: 'English', flag: '🇬🇧' },
  es: { native: 'Español', flag: '🇪🇸' },
  lt: { native: 'Lietuvių', flag: '🇱🇹' },
  lv: { native: 'Latviešu', flag: '🇱🇻' },
  et: { native: 'Eesti', flag: '🇪🇪' },
  pl: { native: 'Polski', flag: '🇵🇱' },
  ru: { native: 'Русский', flag: '🇷🇺' },
  uk: { native: 'Українська', flag: '🇺🇦' },
  de: { native: 'Deutsch', flag: '🇩🇪' },
  fr: { native: 'Français', flag: '🇫🇷' },
  it: { native: 'Italiano', flag: '🇮🇹' },
  pt: { native: 'Português', flag: '🇵🇹' },
  nl: { native: 'Nederlands', flag: '🇳🇱' },
  sv: { native: 'Svenska', flag: '🇸🇪' },
  fi: { native: 'Suomi', flag: '🇫🇮' },
  da: { native: 'Dansk', flag: '🇩🇰' },
  no: { native: 'Norsk', flag: '🇳🇴' },
  cs: { native: 'Čeština', flag: '🇨🇿' },
  tr: { native: 'Türkçe', flag: '🇹🇷' },
};

/** A language's own name, or its code when the table above does not know it. */
export function languageName(code: string): string {
  return LANGUAGE_NAMES[code]?.native ?? code;
}

export function languageFlag(code: string): string {
  return LANGUAGE_NAMES[code]?.flag ?? '🏳️';
}
