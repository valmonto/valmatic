import { base } from '@pkg/vitest-config/base';

export default base({
  test: {
    coverage: {
      exclude: ['src/**/index.ts'],
    },
  },
});
