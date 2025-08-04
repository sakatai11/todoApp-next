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
    testTimeout: 60000, // 60秒のタイムアウト（Firebase Emulator接続用）
    hookTimeout: 60000, // フックタイムアウトも60秒に設定
    env: {
      // Firebase Emulator用環境変数（Docker環境統一）
      FIRESTORE_EMULATOR_HOST: 'firebase-emulator-test:8080',
      FIREBASE_AUTH_EMULATOR_HOST: 'firebase-emulator-test:9099',
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
