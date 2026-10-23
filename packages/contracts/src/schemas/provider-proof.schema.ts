import { z } from 'zod';
import { AUTH_IDENTITY_PROVIDERS } from '../constants/iam.js';

export { AUTH_IDENTITY_PROVIDERS, type AuthIdentityProvider } from '../constants/iam.js';

/**
 * Proof from Apple or Google that the caller is a given person: the identity
 * token (a JWT) the provider's own sheet handed the app.
 *
 * The server trusts nothing in it until the signature is checked against the
 * provider's published keys and the audience against this deployment's client
 * ids. Identity is the token's `sub`; there is deliberately no `email` or
 * `userId` field, because a payload that names who the caller is would be a
 * payload worth forging.
 */
export const ProviderProofSchema = z
  .object({
    provider: z.enum(AUTH_IDENTITY_PROVIDERS),
    identityToken: z.string().min(1).max(8192),
    /**
     * From `POST /auth/provider/nonce`; the app hands it to the provider, which
     * writes it into the token. Required for Apple. Google's native sheet
     * cannot carry one, so there each token is simply good for one use.
     */
    nonce: z.string().min(16).max(128).optional(),
  })
  .strict();

export type ProviderProof = z.infer<typeof ProviderProofSchema>;
