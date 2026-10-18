import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    environmentMatchGlobs: [
      ['frontend/**', 'jsdom'],
    ],
    setupFiles: [
      './frontend/src/test/setup.ts',
    ],
    include: [
      'backend/src/**/*.{spec,test}.ts',
      'shared/src/**/*.{spec,test}.ts',
      'frontend/src/**/*.{spec,test}.{ts,tsx}',
    ],
  },
  resolve: {
    alias: {
      '@cliniassist/shared': path.resolve(__dirname, './shared/src/index.ts'),
    },
  },
});
