// Written by `pnpm valmatic:sync` from valmatic.json. Do not edit.
import { keys as mobile } from './addons/mobile/keys.js';
import mobile_en from './addons/mobile/en.json' with { type: 'json' };
import mobile_es from './addons/mobile/es.json' with { type: 'json' };
import mobile_lt from './addons/mobile/lt.json' with { type: 'json' };

export const addonKeys = { mobile } as const;

export const addonTranslations = {
  en: { ...mobile_en },
  es: { ...mobile_es },
  lt: { ...mobile_lt },
} as const;
