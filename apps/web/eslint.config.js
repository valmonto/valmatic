import { react } from '@pkg/eslint-config/react';
import boundaries from 'eslint-plugin-boundaries';

/**
 * Architectural guardrails for the feature-sliced layout under `src/features/*`.
 *
 *  - A feature may import `shared/` code and its own internals, but NOT another
 *    feature — cross-feature coupling is what turns a modular app back into a
 *    tangle. Shared code that two features need belongs in `shared/`.
 *  - Everyone else must import a feature through its public barrel
 *    (`@/features/<name>`), never by reaching into its internal files.
 *
 * Enforcement is split in two so it needs no import resolver (the `@/` alias is
 * matched lexically):
 *   1. `boundaries/element-types` catches *relative* cross-feature imports
 *      (e.g. `../jobs/api`) — the node resolver handles those.
 *   2. `no-restricted-imports` covers the codebase's `@/`-alias convention.
 *
 * Rules are scoped to the migrated tree; legacy folders are left untouched.
 */
export default [
  ...react,
  {
    files: ['src/features/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'boundaries/include': ['src/features/**/*'],
      'boundaries/elements': [{ type: 'feature', pattern: 'src/features/*', capture: ['name'] }],
    },
    rules: {
      // boundaries v6.0.2 only ships the `element-types` rule (the `dependencies`
      // rename is announced but not yet wired up), so we use the v5 form. It
      // prints a one-time deprecation notice per lint run — harmless.
      'boundaries/element-types': [
        'error',
        {
          default: 'allow',
          rules: [
            {
              from: ['feature'],
              disallow: [['feature', { name: '!${from.name}' }]],
              message:
                'A feature ("${from.name}") may not import from another feature ("${target.name}"). Move shared code to shared/.',
            },
          ],
        },
      ],
      // Inside a feature, never reference another feature by alias; use your own
      // code via relative paths and put cross-feature code in shared/.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*', '@/features/*/*'],
              message:
                'A feature may not import another feature. Move shared code to shared/ instead.',
            },
          ],
        },
      ],
    },
  },
  {
    // Outside features, import a feature only through its public barrel.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/features/**', 'src/shared/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/*'],
              message:
                'Import a feature through its public API (`@/features/<name>`), not its internals.',
            },
          ],
        },
      ],
    },
  },
  {
    // Shared code is the bottom layer: it must NOT depend on any feature
    // (that would invert the dependency and re-tangle the graph).
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*', '@/features/*/*'],
              message:
                'Shared code may not import a feature — dependencies point from features → shared, never the reverse.',
            },
          ],
        },
      ],
    },
  },
];
