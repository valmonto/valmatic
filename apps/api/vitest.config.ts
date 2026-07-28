import { base } from '@pkg/vitest-config/base';

export default base({
  test: {
    setupFiles: ['./__tests__/setup.ts'],
    alias: {
      '@/': new URL('./src/', import.meta.url).pathname,
    },
    coverage: {
      exclude: ['src/**/index.ts', 'src/**/*.module.ts', 'src/main.ts'],
    },
  },
});
