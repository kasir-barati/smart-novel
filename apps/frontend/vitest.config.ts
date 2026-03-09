import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import react from '@vitejs/plugin-react';
/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/frontend',
  plugins: [react(), nxViteTsPaths()],
  test: {
    // Make globals like describe, it, expect available without imports
    globals: true,

    // Browser-like environment for React components
    environment: 'jsdom',

    // Load custom matchers and any globals
    setupFiles: ['./vitest.setup.ts'],

    // If you import CSS or SVGs in components
    css: true,

    // Coverage (optional but common)
    coverage: {
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: '../../coverage/apps/frontend',
    },
  },
  // Define env variables so they work in tests like in the app
  define: {
    'import.meta.env.VITE_EXPLAIN_SELECTION_DEBOUNCE_MS':
      JSON.stringify(
        process.env.VITE_EXPLAIN_SELECTION_DEBOUNCE_MS || '500',
      ),
  },
});
