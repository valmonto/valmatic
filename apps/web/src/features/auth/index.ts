/**
 * Public surface of the auth feature. Other layers import from here
 * (`@/features/auth`) and never reach into internal files directly.
 *
 * Note: the cross-cutting `AuthProvider`/`useAuth` (consumed by every feature)
 * intentionally lives in `@/shared/auth/auth-context`, not here — it is shared
 * infra and will graduate to `shared/`, putting it in a feature would invert
 * the dependency.
 */
export { authRoutes } from './routes';
export { authResource } from './api';
export { useLogin, useRegister } from './hooks/use-auth-actions';
