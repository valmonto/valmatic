import { z } from 'zod';

export const PaginatedRequestSchema = z.object({
  skip: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export function PaginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    meta: z.object({
      total: z.number().int(),
      skip: z.number().int(),
      limit: z.number().int(),
    }),
  });
}

export type PaginatedRequest = z.infer<typeof PaginatedRequestSchema>;

export type PaginatedResponse<T> = {
  data: T[];
  meta: { total: number; skip: number; limit: number };
};
