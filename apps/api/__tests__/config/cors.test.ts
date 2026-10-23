import { describe, expect, it } from 'vitest';
import { CORS_ALLOWED_HEADERS, corsOrigins } from '@/config/cors.js';

describe('corsOrigins', () => {
  it('takes the listed origins, trimmed, ignoring empty entries', () => {
    expect(corsOrigins(' https://app.example.com , https://admin.example.com,')).toEqual([
      'https://app.example.com',
      'https://admin.example.com',
    ]);
  });

  it('falls back to localhost and the LAN when nothing is listed', () => {
    for (const unset of [undefined, '', ' , ']) {
      const origins = corsOrigins(unset);
      expect(origins.every((origin) => origin instanceof RegExp)).toBe(true);
      expect(origins.some((origin) => (origin as RegExp).test('http://localhost:5173'))).toBe(true);
      expect(origins.some((origin) => (origin as RegExp).test('https://evil.example'))).toBe(false);
    }
  });
});

describe('CORS_ALLOWED_HEADERS', () => {
  it('allows what every client sends', () => {
    expect(CORS_ALLOWED_HEADERS).toEqual(
      expect.arrayContaining(['Content-Type', 'Authorization', 'X-Client']),
    );
  });
});
