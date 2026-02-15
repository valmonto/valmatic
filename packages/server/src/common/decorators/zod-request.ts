import type { ExecutionContext } from '@nestjs/common';
import {
  createParamDecorator,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { z } from 'zod';

/**
 * Validates raw request data against a Zod schema.
 * Throws BadRequestException on validation failure.
 * Throws InternalServerErrorException if schema is missing.
 */
export function validateZodRequest<T extends z.ZodType>(schema: T, raw: unknown): z.infer<T> {
  if (!schema) {
    throw new InternalServerErrorException();
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new BadRequestException(result.error.flatten());
  }

  return result.data as z.infer<T>;
}

/**
 * Parameter decorator that validates combined request data (params + query + body)
 * against a Zod schema.
 */
export function ZodRequest<T extends z.ZodType>(schema: T): ParameterDecorator {
  return createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<FastifyRequest>();
    const raw = {
      ...(req.params as object),
      ...(req.query as object),
      ...(req.body as object),
    };
    return validateZodRequest(schema, raw);
  })();
}
