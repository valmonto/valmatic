import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import {
  translations,
  defaultLanguage,
  detectLanguageFromHeader,
  type SupportedLanguage,
} from '@pkg/locales';

@Injectable({ scope: Scope.REQUEST })
export class I18nService {
  private readonly lang: SupportedLanguage;

  constructor(@Inject(REQUEST) request: FastifyRequest) {
    this.lang = detectLanguageFromHeader(request.headers['accept-language']);
  }

  /**
   * Translate a message. If no translation exists, returns the key (English text).
   * @param key - The English text to translate
   * @param args - Optional interpolation arguments
   */
  t(key: string, args?: Record<string, unknown>): string {
    // English is the default - just return the key
    if (this.lang === defaultLanguage) {
      return this.interpolate(key, args);
    }

    // Look up translation
    const langTranslations = translations[this.lang as keyof typeof translations];
    const translated = langTranslations?.[key as keyof typeof langTranslations] as
      string | undefined;

    return this.interpolate(translated ?? key, args);
  }

  /**
   * Get current language from request
   */
  getCurrentLanguage(): SupportedLanguage {
    return this.lang;
  }

  private interpolate(text: string, args?: Record<string, unknown>): string {
    if (!args) return text;
    return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
      const value = args[key];
      // Only scalars interpolate; an object would render as "[object Object]",
      // so it is left as the placeholder rather than leaked into a message.
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
      }
      return `{{${key}}}`;
    });
  }
}
