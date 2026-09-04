import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { validateEnv } from '@/config/env.schema.js';

const url = 'postgresql://user:pass@localhost:5432/db';

/**
 * Property-based tests state a rule that must hold for *every* input, then let
 * fast-check hunt for a counterexample across hundreds of generated cases —
 * including the boundaries and odd values nobody thinks to write by hand.
 *
 * The example-based suite next door pins specific known cases. These pin the
 * invariants, which is what stops a refactor quietly widening what the schema
 * accepts.
 */
describe('validateEnv — properties', () => {
  it('accepts every port in range and returns it as a number', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 65535 }), (port) => {
        const env = validateEnv({ DATABASE_URL: url, REDIS_PORT: String(port) });

        expect(env.REDIS_PORT).toBe(port);
      }),
    );
  });

  it('rejects every port outside the valid range', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.integer({ min: -100_000, max: 0 }), fc.integer({ min: 65_536, max: 200_000 })),
        (port) => {
          expect(() => validateEnv({ DATABASE_URL: url, REDIS_PORT: String(port) })).toThrow();
        },
      ),
    );
  });

  it('never returns a NaN port, whatever string arrives', () => {
    fc.assert(
      fc.property(fc.string(), (raw) => {
        try {
          const env = validateEnv({ DATABASE_URL: url, REDIS_PORT: raw });
          expect(Number.isNaN(env.REDIS_PORT)).toBe(false);
        } catch {
          // Rejecting the input is a valid outcome; silently yielding NaN is not.
        }
      }),
    );
  });

  it('treats only the exact string "true" as enabling LOG_FRAMEWORK', () => {
    fc.assert(
      fc.property(fc.constantFrom('true', 'false'), (flag) => {
        expect(validateEnv({ DATABASE_URL: url, LOG_FRAMEWORK: flag }).LOG_FRAMEWORK).toBe(
          flag === 'true',
        );
      }),
    );
  });

  it('rejects any string that is not a postgres connection URL', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !/^postgres(ql)?:\/\/.+/.test(s)),
        (notAPostgresUrl) => {
          expect(() => validateEnv({ DATABASE_URL: notAPostgresUrl })).toThrow(/DATABASE_URL/);
        },
      ),
    );
  });

  it('accepts postgres:// and postgresql:// forms', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('postgres', 'postgresql'),
        fc.stringMatching(/^[a-z]{1,8}$/),
        (scheme, host) => {
          expect(() =>
            validateEnv({ DATABASE_URL: `${scheme}://u:p@${host}:5432/db` }),
          ).not.toThrow();
        },
      ),
    );
  });
});
