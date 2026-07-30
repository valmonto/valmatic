// Feature flags only for now: they need no SDK (server-resolved via /auth/me).
// PostHog React Native (analytics + replay) is a deliberate later addition —
// it brings native dependencies, so it lands when a product needs it.
export { useFeature } from './use-feature';
