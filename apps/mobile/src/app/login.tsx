// Expo Router is file-based, so routes must live under src/app. To keep the
// web app's feature-sliced model, this route file is a thin re-export — the
// screen itself is owned by the auth feature (the mobile analog of web's thin
// `pages/` delegating to feature screens).
export { LoginScreen as default } from '@/features/auth';
