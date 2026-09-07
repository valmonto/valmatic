import { base } from '@pkg/vitest-config/base';

export default base({
  test: {
    coverage: {
      // Schema files are declarations; migrations and the CLI need a database.
      exclude: ['src/**/index.ts', 'src/schema/**', 'src/migrations/**', 'src/cli/**'],
    },
  },
});
