import { z } from 'zod';

// --- Example Job Action ---
export const ExampleJobActionSchema = z.enum(['send-email', 'generate-report', 'sync-data']);

export type ExampleJobAction = z.infer<typeof ExampleJobActionSchema>;

// --- Create Example Job ---
// No userId field: the job is attributed to the SESSION user by the API.
// Accepting an identity from the payload would let any caller enqueue work
// attributed to someone else — the same class of hole as trusting a body id
// anywhere else.
export const CreateExampleJobRequestSchema = z
  .object({
    action: ExampleJobActionSchema,
    data: z.record(z.string(), z.unknown()).default({}),
    priority: z.number().int().min(1).max(10).optional(),
    delay: z.number().int().min(0).optional(),
  })
  .strict();

export const CreateExampleJobResponseSchema = z.object({
  success: z.literal(true),
  jobId: z.string().optional(),
  queue: z.string(),
  message: z.string(),
});

export type CreateExampleJobRequest = z.infer<typeof CreateExampleJobRequestSchema>;
export type CreateExampleJobResponse = z.infer<typeof CreateExampleJobResponseSchema>;

// --- Create Example Jobs Bulk ---
export const CreateExampleJobsBulkRequestSchema = z
  .object({
    jobs: z.array(CreateExampleJobRequestSchema.omit({ priority: true, delay: true })),
  })
  .strict();

export const CreateExampleJobsBulkResponseSchema = z.object({
  success: z.literal(true),
  count: z.number().int(),
  jobIds: z.array(z.string().optional()),
  message: z.string(),
});

export type CreateExampleJobsBulkRequest = z.infer<typeof CreateExampleJobsBulkRequestSchema>;
export type CreateExampleJobsBulkResponse = z.infer<typeof CreateExampleJobsBulkResponseSchema>;
