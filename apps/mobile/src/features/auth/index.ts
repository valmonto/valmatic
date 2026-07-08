/**
 * Public surface of the auth feature. Route files and other layers import from
 * here (`@/features/auth`) and never reach into internal files directly — the
 * same convention the web app enforces with ESLint boundaries.
 */
export { default as LoginScreen } from './screens/login.screen';
