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
 * Parameter decorator that validates the whole request — body, query string and
 * path params merged — against a single Zod schema.
 *
 * Precedence runs body → query → **params**, so the path always wins. It has to:
 * the path identifies the resource, and if the body could override it, a request
 * to `PATCH /users/AAA` carrying `{ "id": "BBB" }` would resolve to `BBB` and
 * update someone else's record. Widening a schema would silently open that hole,
 * which is not a decision any single controller should be able to make.
 *
 * A path segment therefore cannot be forged by the payload, and schemas can
 * describe the request as one shape — `{ id, name }` — regardless of which part
 * of the request each field arrived on.
 */
export function mergeRequestInput(req: {
  body?: unknown;
  query?: unknown;
  params?: unknown;
}): Record<string, unknown> {
  return {
    ...(req.body as object),
    ...(req.query as object),
    ...(req.params as object),
  };
}

export function ZodRequest<T extends z.ZodType>(schema: T): ParameterDecorator {
  return createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<FastifyRequest>();
    return validateZodRequest(schema, mergeRequestInput(req));
  })();
}
