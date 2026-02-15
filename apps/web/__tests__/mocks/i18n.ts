import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['common'],
  defaultNS: 'common',
  resources: {
    en: {
      common: {},
    },
  },
  interpolation: {
    escapeValue: false,
  },
  // Return the key as the translation (useful for testing)
  returnEmptyString: false,
  parseMissingKeyHandler: (key) => key,
});

export default i18n;
