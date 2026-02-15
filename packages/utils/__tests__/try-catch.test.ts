import { describe, it, expect } from 'vitest';
import { tryCatch } from '../src/try-catch';

describe('tryCatch', () => {
  describe('successful promises', () => {
    it('returns data and null error on success', async () => {
      const promise = Promise.resolve('hello');

      const result = await tryCatch(promise);

      expect(result.d).toBe('hello');
      expect(result.e).toBeNull();
    });

    it('handles resolved objects', async () => {
      const data = { id: 1, name: 'test' };
      const promise = Promise.resolve(data);

      const result = await tryCatch(promise);

      expect(result.d).toEqual(data);
      expect(result.e).toBeNull();
    });

    it('handles resolved arrays', async () => {
      const data = [1, 2, 3];
      const promise = Promise.resolve(data);

      const result = await tryCatch(promise);

      expect(result.d).toEqual(data);
      expect(result.e).toBeNull();
    });

    it('handles resolved null', async () => {
      const promise = Promise.resolve(null);

      const result = await tryCatch(promise);

      expect(result.d).toBeNull();
      expect(result.e).toBeNull();
    });

    it('handles resolved undefined', async () => {
      const promise = Promise.resolve(undefined);

      const result = await tryCatch(promise);

      expect(result.d).toBeUndefined();
      expect(result.e).toBeNull();
    });
  });

  describe('rejected promises', () => {
    it('returns null data and error on rejection', async () => {
      const error = new Error('something went wrong');
      const promise = Promise.reject(error);

      const result = await tryCatch(promise);

      expect(result.d).toBeNull();
      expect(result.e).toBe(error);
    });

    it('handles string rejection', async () => {
      const promise = Promise.reject('string error');

      const result = await tryCatch<string, string>(promise);

      expect(result.d).toBeNull();
      expect(result.e).toBe('string error');
    });

    it('handles rejection with custom error type', async () => {
      class CustomError extends Error {
        code: number;
        constructor(message: string, code: number) {
          super(message);
          this.code = code;
        }
      }

      const error = new CustomError('custom error', 500);
      const promise = Promise.reject(error);

      const result = await tryCatch<string, CustomError>(promise);

      expect(result.d).toBeNull();
      expect(result.e).toBeInstanceOf(CustomError);
      expect(result.e?.code).toBe(500);
      expect(result.e?.message).toBe('custom error');
    });
  });

  describe('ORM error handling', () => {
    it('enhances error message when cause.message exists', async () => {
      const ormError = new Error('original message');
      (ormError as Error & { cause: { message: string } }).cause = {
        message: 'cause message',
      };
      const promise = Promise.reject(ormError);

      const result = await tryCatch(promise);

      expect(result.d).toBeNull();
      expect(result.e?.message).toBe('cause message original message');
    });

    it('does not modify error without cause', async () => {
      const error = new Error('original message');
      const promise = Promise.reject(error);

      const result = await tryCatch(promise);

      expect(result.d).toBeNull();
      expect(result.e?.message).toBe('original message');
    });

    it('does not modify error with cause but no message', async () => {
      const error = new Error('original message');
      (error as Error & { cause: object }).cause = {};
      const promise = Promise.reject(error);

      const result = await tryCatch(promise);

      expect(result.d).toBeNull();
      expect(result.e?.message).toBe('original message');
    });
  });

  describe('async function handling', () => {
    it('works with async functions', async () => {
      const asyncFn = async () => {
        return 'async result';
      };

      const result = await tryCatch(asyncFn());

      expect(result.d).toBe('async result');
      expect(result.e).toBeNull();
    });

    it('catches errors from async functions', async () => {
      const asyncFn = async () => {
        throw new Error('async error');
      };

      const result = await tryCatch(asyncFn());

      expect(result.d).toBeNull();
      expect(result.e?.message).toBe('async error');
    });

    it('works with delayed promises', async () => {
      const delayedPromise = new Promise<string>((resolve) => {
        setTimeout(() => resolve('delayed'), 10);
      });

      const result = await tryCatch(delayedPromise);

      expect(result.d).toBe('delayed');
      expect(result.e).toBeNull();
    });
  });
});
