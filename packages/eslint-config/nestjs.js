// @ts-check
import { base } from './base.js';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export const nestjs = [
  ...base,
  {
    files: ['**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
];

export default nestjs;
