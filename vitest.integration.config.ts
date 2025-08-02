import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup-integration.ts'],
    include: ['**/*integration*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.next'],
    testTimeout: 30000, // 30秒のタイムアウト（Firebase Emulator接続用）
    hookTimeout: 30000, // フックタイムアウトも30秒に設定
    env: {
      // Firebase Emulator用環境変数
      FIRESTORE_EMULATOR_HOST: 'localhost:8090',
      FIREBASE_AUTH_EMULATOR_HOST: 'localhost:9100',
      NEXT_PUBLIC_EMULATOR_MODE: 'true',
      GCLOUD_PROJECT: 'todoapp-test',
      FIREBASE_PROJECT_ID: 'todoapp-test',
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
});
