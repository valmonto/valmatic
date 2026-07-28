import { describe, expect, it } from 'vitest';
import { k, supportedLanguages, translations } from '../src/index';

/** Every leaf value in `k`, i.e. every key the apps can actually reference. */
function catalogue(node: unknown, found: string[] = []): string[] {
  if (typeof node === 'string') found.push(node);
  else if (node && typeof node === 'object') {
    for (const value of Object.values(node)) catalogue(value, found);
  }
  return found;
}

/**
 * i18next resolves `thing` from `thing_one` / `thing_other`, so a plural key
 * is present without an entry under its own name.
 */
const PLURAL_SUFFIXES = ['_zero', '_one', '_two', '_few', '_many', '_other'];

function isTranslated(key: string, entries: Record<string, string>): boolean {
  return key in entries || PLURAL_SUFFIXES.some((suffix) => `${key}${suffix}` in entries);
}

const KEYS = catalogue(k);

describe('translations', () => {
  it('exposes a non-trivial catalogue', () => {
    expect(KEYS.length).toBeGreaterThan(200);
  });

  // A key with no entry is not an error — i18next renders the key itself, so
  // the user sees "auth.errors.sessionExpired" and nothing fails.
  it.each(supportedLanguages)('%s translates every key in the catalogue', (lang) => {
    const entries = translations[lang] as Record<string, string>;
    const missing = KEYS.filter((key) => !isTranslated(key, entries));

    expect(missing).toEqual([]);
  });

  it.each(supportedLanguages)('%s has no blank strings', (lang) => {
    const entries = translations[lang] as Record<string, string>;
    const blank = Object.entries(entries)
      .filter(([, value]) => typeof value !== 'string' || value.trim() === '')
      .map(([key]) => key);

    expect(blank).toEqual([]);
  });

  it('keeps every language on the same set of entries', () => {
    const [reference, ...rest] = supportedLanguages;
    const expected = Object.keys(translations[reference]).sort();

    for (const lang of rest) {
      expect(Object.keys(translations[lang]).sort()).toEqual(expected);
    }
  });

  it('uses flat dotted keys, not nested objects', () => {
    for (const lang of supportedLanguages) {
      for (const value of Object.values(translations[lang])) {
        expect(typeof value).toBe('string');
      }
    }
  });
});
