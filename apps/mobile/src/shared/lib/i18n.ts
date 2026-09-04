import {
  defaultLanguage,
  i18nConfig,
  supportedLanguages,
  translations,
  type SupportedLanguage,
} from '@pkg/locales';
import * as SecureStore from 'expo-secure-store';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const LANGUAGE_KEY = 'valmatic.language';
const isSupported = (v: string | null | undefined): v is SupportedLanguage =>
  !!v && (supportedLanguages as readonly string[]).includes(v);

/**
 * Best-effort device language via Hermes `Intl` (no native module needed), then
 * constrained to a supported language. Falls back to the default.
 */
function detectDeviceLanguage(): SupportedLanguage {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale; // e.g. "en-US"
    const code = locale.split('-')[0]?.toLowerCase();
    return isSupported(code) ? code : defaultLanguage;
  } catch {
    return defaultLanguage;
  }
}

// Resources come from `@pkg/locales` (single source of truth, shared with web).
// Keys are flat + dotted (e.g. "auth.email") → disable the separators so they
// resolve literally.
i18n.use(initReactI18next).init({
  // Built from @pkg/locales' supported list, so a new language added there flows
  // through here automatically — no hardcoding per locale.
  resources: Object.fromEntries(
    supportedLanguages.map((lng) => [lng, { translation: translations[lng] }]),
  ),
  lng: detectDeviceLanguage(),
  ...i18nConfig,
  keySeparator: false,
  nsSeparator: false,
});

// Apply a persisted manual override once (async — runs right after sync init).
SecureStore.getItemAsync(LANGUAGE_KEY).then((saved) => {
  if (isSupported(saved) && saved !== i18n.language) i18n.changeLanguage(saved);
});

/** Change the app language and persist the choice across restarts. */
export async function setLanguage(lang: SupportedLanguage): Promise<void> {
  await i18n.changeLanguage(lang);
  await SecureStore.setItemAsync(LANGUAGE_KEY, lang);
}

export { supportedLanguages, type SupportedLanguage };
export default i18n;
