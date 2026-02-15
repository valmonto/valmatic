import en from './translations/en.json';
import es from './translations/es.json';

// Export all keys
export * from './keys';
export { k } from './keys';

export const supportedLanguages = ['en', 'es'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

export const defaultLanguage: SupportedLanguage = 'en';

// Translation resources - single source of truth for all apps
export const translations = {
  en,
  es,
} as const;

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
