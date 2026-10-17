import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'backend/src/**/*.spec.ts',
      'backend/src/**/*.test.ts',
      'shared/src/**/*.spec.ts',
      'shared/src/**/*.test.ts',
      'frontend/src/**/*.spec.ts',
      'frontend/src/**/*.test.ts',
    ],
  },
  resolve: {
    alias: {
      '@odontoflow/shared': path.resolve(__dirname, './shared/src/index.ts'),
    },
  },
});
