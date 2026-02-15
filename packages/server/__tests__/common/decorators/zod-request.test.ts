import { describe, it, expect } from 'vitest';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { z } from 'zod';
import { validateZodRequest } from '../../../src/common/decorators/zod-request';

describe('validateZodRequest', () => {
  const testSchema = z.object({
    name: z.string().min(1),
    age: z.number().min(0),
  });

  describe('successful validation', () => {
    it('should return parsed data when input is valid', () => {
      const input = { name: 'John', age: 25 };

      const result = validateZodRequest(testSchema, input);

      expect(result).toEqual({ name: 'John', age: 25 });
    });

    it('should strip unknown properties', () => {
      const input = { name: 'John', age: 25, extra: 'field' };

      const result = validateZodRequest(testSchema, input);

      expect(result).toEqual({ name: 'John', age: 25 });
      expect(result).not.toHaveProperty('extra');
    });

    it('should handle optional fields', () => {
      const schemaWithOptional = z.object({
        name: z.string(),
        nickname: z.string().optional(),
      });

      const result = validateZodRequest(schemaWithOptional, { name: 'John' });

      expect(result).toEqual({ name: 'John' });
    });

    it('should apply default values', () => {
      const schemaWithDefault = z.object({
        name: z.string(),
        role: z.string().default('user'),
      });

      const result = validateZodRequest(schemaWithDefault, { name: 'John' });

      expect(result).toEqual({ name: 'John', role: 'user' });
    });
  });

  describe('validation errors', () => {
    it('should throw BadRequestException when validation fails', () => {
      const input = { name: '', age: 25 }; // name too short

      expect(() => validateZodRequest(testSchema, input)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException with flattened errors', () => {
      const input = { name: '', age: -1 };

      try {
        validateZodRequest(testSchema, input);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = (error as BadRequestException).getResponse() as Record<string, unknown>;
        // BadRequestException wraps the flattened Zod error directly in message
        // Structure: { message: { formErrors: [], fieldErrors: {...} }, error: 'Bad Request', statusCode: 400 }
        // Or just the flattened error object directly
        const errorData = response.message ?? response;
        expect(errorData).toHaveProperty('fieldErrors');
      }
    });

    it('should throw BadRequestException for missing required fields', () => {
      const input = { name: 'John' }; // missing age

      expect(() => validateZodRequest(testSchema, input)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for wrong types', () => {
      const input = { name: 'John', age: 'not a number' };

      expect(() => validateZodRequest(testSchema, input)).toThrow(BadRequestException);
    });
  });

  describe('missing schema', () => {
    it('should throw InternalServerErrorException when schema is null', () => {
      expect(() => validateZodRequest(null as never, {})).toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException when schema is undefined', () => {
      expect(() => validateZodRequest(undefined as never, {})).toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('complex schemas', () => {
    it('should validate nested objects', () => {
      const nestedSchema = z.object({
        user: z.object({
          name: z.string(),
          email: z.string().email(),
        }),
      });

      const input = { user: { name: 'John', email: 'john@example.com' } };
      const result = validateZodRequest(nestedSchema, input);

      expect(result).toEqual(input);
    });

    it('should validate arrays', () => {
      const arraySchema = z.object({
        tags: z.array(z.string()),
      });

      const input = { tags: ['a', 'b', 'c'] };
      const result = validateZodRequest(arraySchema, input);

      expect(result).toEqual(input);
    });

    it('should validate union types', () => {
      const unionSchema = z.object({
        id: z.union([z.string(), z.number()]),
      });

      expect(validateZodRequest(unionSchema, { id: 'abc' })).toEqual({ id: 'abc' });
      expect(validateZodRequest(unionSchema, { id: 123 })).toEqual({ id: 123 });
    });
  });
});
