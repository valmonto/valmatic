// Written by `pnpm valmatic:sync` from valmatic.json. Do not edit.
import { keys as demo } from './addons/demo/keys.js';
import demo_en from './addons/demo/en.json' with { type: 'json' };
import demo_es from './addons/demo/es.json' with { type: 'json' };
import demo_lt from './addons/demo/lt.json' with { type: 'json' };
import { keys as mobile } from './addons/mobile/keys.js';
import mobile_en from './addons/mobile/en.json' with { type: 'json' };
import mobile_es from './addons/mobile/es.json' with { type: 'json' };
import mobile_lt from './addons/mobile/lt.json' with { type: 'json' };

export const addonKeys = { demo, mobile } as const;

export const addonTranslations = {
  en: { ...demo_en, ...mobile_en },
  es: { ...demo_es, ...mobile_es },
  lt: { ...demo_lt, ...mobile_lt },
} as const;
