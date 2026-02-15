export default {
  // Only generate es.json - English uses keys directly
  locales: ['es'],
  output: 'packages/locales/src/translations/$LOCALE.json',
  input: [
    // Frontend
    'apps/web/src/**/*.{ts,tsx}',
    // Backend
    'apps/api/src/**/*.ts',
    'apps/worker/src/**/*.ts',
    // Shared packages
    'packages/server/src/**/*.ts',
    'packages/contracts/src/**/*.ts',
    // Backend/Zod translation keys
    'packages/locales/src/keys.ts',
  ],
  sort: true,
  keySeparator: false,
  namespaceSeparator: false,
  // Don't create namespace folders
  createOldCatalogs: false,
  // Keep translations not found in code (for backend errors, dynamic keys)
  keepRemoved: true,
  // Fail on warnings in CI
  failOnWarnings: false,
};
