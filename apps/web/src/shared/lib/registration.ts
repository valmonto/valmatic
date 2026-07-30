/**
 * Whether this deployment offers open self-registration.
 *
 * Rendering only — the API enforces its own AUTH_REGISTRATION_ENABLED
 * regardless, so the two env vars are set together per deployment. Closed by
 * default, matching the server: most products gate account creation behind
 * their own onboarding.
 */
export const REGISTRATION_ENABLED = import.meta.env.VITE_PUBLIC_REGISTRATION_ENABLED === 'true';
