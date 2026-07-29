import { z } from 'zod';

/**
 * A request that carries no input.
 *
 * Strict on purpose: `z.object({})` accepts any payload and silently discards
 * it, so a handler validating against it is doing nothing while looking like it
 * validates. This rejects anything sent, which turns a client bug into a 400
 * instead of a silent no-op.
 */
export const EmptyRequestSchema = z.strictObject({});
export type EmptyRequest = z.infer<typeof EmptyRequestSchema>;
