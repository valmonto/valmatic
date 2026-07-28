import react from '@vitejs/plugin-react-swc';
import { defineConfig, mergeConfig } from 'vitest/config';
import { base } from './base.js';

/**
 * Shared Vitest config for React workspaces — the Node base plus jsdom and the
 * React plugin.
 *
 * @param {import('vitest/config').UserConfig} [overrides]
 */
export function react_(overrides = {}) {
  return mergeConfig(
    mergeConfig(
      base(),
      defineConfig({
        plugins: [react()],
        test: {
          environment: 'jsdom',
          include: ['__tests__/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
          coverage: {
            include: ['src/**/*.{ts,tsx}'],
            exclude: ['src/**/index.ts', 'src/**/*.d.ts'],
          },
        },
      }),
    ),
    defineConfig(overrides),
  );
}

export { react_ as react };
