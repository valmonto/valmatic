import { REQUEST } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { defaultLanguage, supportedLanguages } from '@pkg/locales';
import { describe, expect, it } from 'vitest';
import { I18nService } from '@/i18n/i18n.service.js';

/**
 * Example of testing a REQUEST-scoped Nest provider: supply a stub request and
 * `resolve()` (not `get()`) the instance, since request-scoped providers are
 * instantiated per resolution rather than once per module.
 */
async function serviceFor(acceptLanguage?: string): Promise<I18nService> {
  const moduleRef = await Test.createTestingModule({
    providers: [
      I18nService,
      { provide: REQUEST, useValue: { headers: { 'accept-language': acceptLanguage } } },
    ],
  }).compile();

  return moduleRef.resolve(I18nService);
}

describe('I18nService', () => {
  it('falls back to the default language when no header is sent', async () => {
    const service = await serviceFor(undefined);

    expect(service.getCurrentLanguage()).toBe(defaultLanguage);
  });

  it('returns the key unchanged for the default language', async () => {
    const service = await serviceFor('en');

    expect(service.t('Hello')).toBe('Hello');
  });

  // Any language the project keeps other than the default (valmatic.json);
  // a project that keeps only one has nothing to pick between.
  const other = supportedLanguages.find((l) => l !== defaultLanguage);

  it.skipIf(!other)('picks the language from the Accept-Language header', async () => {
    const service = await serviceFor(`${other}-XX,${other};q=0.9,${defaultLanguage};q=0.8`);

    expect(service.getCurrentLanguage()).toBe(other);
  });

  it('interpolates arguments into the message', async () => {
    const service = await serviceFor('en');

    expect(service.t('Hello {{name}}', { name: 'Lukas' })).toBe('Hello Lukas');
  });

  it('returns the key when a translation is missing', async () => {
    const service = await serviceFor(other ?? defaultLanguage);

    expect(service.t('__no_such_translation_key__')).toBe('__no_such_translation_key__');
  });
});
