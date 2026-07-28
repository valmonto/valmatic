import { react } from '@pkg/vitest-config/react';

export default react({
  test: {
    setupFiles: ['./__tests__/setup.ts'],
    alias: {
      '@/': new URL('./src/', import.meta.url).pathname,
    },
  },
});
