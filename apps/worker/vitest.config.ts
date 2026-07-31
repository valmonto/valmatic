import { base } from '@pkg/vitest-config/base';

export default base({
  test: {
    // The integration suites (describeIntegration) share ONE database and
    // truncate the same tables — parallel test FILES race each other's
    // truncates exactly like parallel packages did before the workspace test
    // step was serialized. Same cure one level down.
    fileParallelism: false,
    setupFiles: ['./__tests__/setup.ts'],
    alias: {
      '@/': new URL('./src/', import.meta.url).pathname,
    },
    coverage: {
      exclude: ['src/**/index.ts', 'src/**/*.module.ts', 'src/main.ts'],
    },
  },
});
