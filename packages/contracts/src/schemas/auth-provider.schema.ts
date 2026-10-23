import { z } from 'zod';
import { AuthTokensSchema } from './auth.schema.js';
import { ProviderProofSchema } from './provider-proof.schema.js';

export const ProviderSignInRequestSchema = ProviderProofSchema.extend({
  /**
   * Apple gives the name to the app on the first sign-in only and never puts
   * it in the token. Used only to name a new account; ignored otherwise.
   */
  fullName: z.string().trim().min(1).max(120).optional(),
  /** The language of anything sent to a new account. */
  locale: z.string().min(2).max(10).optional(),
}).strict();

export const ProviderNonceResponseSchema = z.object({ nonce: z.string() });

export const ProviderSignInResponseSchema = z.object({
  user: z.object({ id: z.string().uuid(), email: z.string(), name: z.string() }),
  /** True when this sign-in created the account. */
  created: z.boolean(),
  /** For `X-Client: mobile`; a browser gets cookies instead. */
  tokens: AuthTokensSchema.optional(),
});

export type ProviderSignInRequest = z.infer<typeof ProviderSignInRequestSchema>;
export type ProviderNonceResponse = z.infer<typeof ProviderNonceResponseSchema>;
export type ProviderSignInResponse = z.infer<typeof ProviderSignInResponseSchema>;
