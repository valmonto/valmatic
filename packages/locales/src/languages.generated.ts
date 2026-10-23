// Written by `pnpm valmatic:sync` from valmatic.json. Do not edit.
import en from './translations/en.json' with { type: 'json' };
import es from './translations/es.json' with { type: 'json' };
import lt from './translations/lt.json' with { type: 'json' };
import { addonTranslations } from './addons.generated.js';

export const supportedLanguages = ['en', 'es', 'lt'] as const;

export const defaultLanguage = 'en' as const;

export const translations = {
  en: { ...en, ...addonTranslations.en },
  es: { ...es, ...addonTranslations.es },
  lt: { ...lt, ...addonTranslations.lt },
} as const;
