// Export all keys
export * from './keys/index.js';
export { k } from './keys/index.js';
export { LANGUAGE_NAMES, languageName, languageFlag } from './languages.js';

// The languages this project keeps and its default (valmatic.json), and the
// texts per language — core and every kept add-on's. Written by
// `pnpm valmatic:sync`.
import { defaultLanguage as chosenDefault, supportedLanguages } from './languages.generated.js';
export { supportedLanguages, translations } from './languages.generated.js';
export type SupportedLanguage = (typeof supportedLanguages)[number];
export const defaultLanguage: SupportedLanguage = chosenDefault;

// Shared i18next configuration
export const i18nConfig = {
  fallbackLng: defaultLanguage,
  supportedLngs: supportedLanguages,
  interpolation: {
    escapeValue: false, // React already escapes
  },
  returnEmptyString: false,
} as const;

// Helper to detect language from Accept-Language header
export function detectLanguageFromHeader(acceptLanguage: string | undefined): SupportedLanguage {
  if (!acceptLanguage) return defaultLanguage;

  const languages = acceptLanguage
    .split(',')
    .map((lang) => {
      const [code, priority] = lang.trim().split(';q=');
      const langCode = code?.split('-')[0]?.toLowerCase();
      return {
        code: langCode,
        priority: priority ? parseFloat(priority) : 1,
      };
    })
    .sort((a, b) => b.priority - a.priority);

  for (const { code } of languages) {
    if (code && supportedLanguages.includes(code as SupportedLanguage)) {
      return code as SupportedLanguage;
    }
  }

  return defaultLanguage;
}
