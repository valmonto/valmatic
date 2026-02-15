export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Enforce specific scopes matching your monorepo packages
    'scope-enum': [
      2,
      'always',
      [
        // apps
        'api',
        'web',
        'worker',
        'e2e',
        // packages
        'contracts',
        'database',
        'eslint-config',
        'locales',
        'server',
        'tsconfig',
        'utils',
        // root-level changes
        'deps',
        'ci',
        'release',
        'config',
      ],
    ],
    // Warn if no scope provided (not error, to allow root-level commits)
    'scope-empty': [1, 'never'],
    // Ensure subject doesn't end with period
    'subject-full-stop': [2, 'never', '.'],
    // Ensure subject is lowercase
    'subject-case': [2, 'always', 'lower-case'],
  },
};
