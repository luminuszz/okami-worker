import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

import tsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    tsConfigPaths(),
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
  test: {
    coverage: {
      provider: 'v8',
      exclude: ['**/node_modules/**', '**/test/**'],
      include: ['src/**/*.ts'],
    },

    globals: true,
    clearMocks: true,
    passWithNoTests: true,
  },
});
