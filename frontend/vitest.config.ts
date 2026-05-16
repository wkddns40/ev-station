import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary', 'json'],
      include: ['src/lib/**', 'src/state/**', 'src/hooks/**'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/__tests__/**'],
      thresholds: {
        'src/lib/**': { lines: 70, functions: 70, branches: 70, statements: 70 },
        'src/state/**': { lines: 70, functions: 70, branches: 70, statements: 70 },
      },
    },
  },
});
