import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { defaultLanguage, supportedLanguages, translations } from '@pkg/locales';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: translations.en },
      es: { translation: translations.es },
    },
    fallbackLng: defaultLanguage,
    supportedLngs: [...supportedLanguages],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    returnEmptyString: false,
    // Debug mode in development to catch missing keys
    debug: import.meta.env.DEV,
    saveMissing: import.meta.env.DEV,
    missingKeyHandler: import.meta.env.DEV
      ? (_lngs, _ns, key) => {
          console.warn(`[i18n] Missing translation key: "${key}"`);
        }
      : undefined,
  });

export default i18n;
