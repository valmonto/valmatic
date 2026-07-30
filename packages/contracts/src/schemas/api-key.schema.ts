import { z } from 'zod';
import { MCP_SCOPES } from '../constants';
import { EmptyRequestSchema } from './common.schema';

export const McpScopeSchema = z.enum(MCP_SCOPES);

export const ApiKeySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  /** Leading chars kept to recognise a key in a list — never the full key. */
  prefix: z.string(),
  scopes: z.array(McpScopeSchema),
  lastUsedAt: z.string().nullable(),
  createdAt: z.string(),
});

export type ApiKey = z.infer<typeof ApiKeySchema>;

// --- Create ---
export const CreateApiKeyRequestSchema = z
  .object({
    name: z.string().min(1).max(64),
    scopes: z.array(McpScopeSchema).min(1),
  })
  .strict();

/** `key` is the plaintext, returned ONCE at creation and never again. */
export const CreateApiKeyResponseSchema = ApiKeySchema.extend({ key: z.string() });

export type CreateApiKeyRequest = z.infer<typeof CreateApiKeyRequestSchema>;
export type CreateApiKeyResponse = z.infer<typeof CreateApiKeyResponseSchema>;

// --- List ---
export const ListApiKeysRequestSchema = EmptyRequestSchema;
export const ListApiKeysResponseSchema = z.object({ data: z.array(ApiKeySchema) });

export type ListApiKeysRequest = z.infer<typeof ListApiKeysRequestSchema>;
export type ListApiKeysResponse = z.infer<typeof ListApiKeysResponseSchema>;

// --- Revoke ---
export const RevokeApiKeyRequestSchema = z.object({ id: z.string().uuid() }).strict();
export const RevokeApiKeyResponseSchema = z.object({});

export type RevokeApiKeyRequest = z.infer<typeof RevokeApiKeyRequestSchema>;
export type RevokeApiKeyResponse = z.infer<typeof RevokeApiKeyResponseSchema>;
