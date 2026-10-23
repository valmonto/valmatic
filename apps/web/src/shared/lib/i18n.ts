import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { defaultLanguage, supportedLanguages, translations } from '@pkg/locales';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Every language the app is offered in. (Only English and Spanish used
    // to be loaded here, so choosing Lithuanian in the switcher
    // silently showed English.)
    resources: Object.fromEntries(
      supportedLanguages.map((language) => [language, { translation: translations[language] }]),
    ),
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
