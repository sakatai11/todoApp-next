/**
 * 統合テスト用セットアップファイル
 * Firebase Emulatorとの連携設定
 */

import { beforeAll, afterAll, beforeEach } from 'vitest';
import { initializeTestDatabase, clearTestData } from './setup-db';
import { server } from '@/todoApp-submodule/mocks/server';

// Firebase Emulator環境変数の設定
(process.env as Record<string, string | undefined>).NODE_ENV = 'test';
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8081';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9100';
process.env.FIREBASE_PROJECT_ID = 'todoapp-test';

// Docker環境のNext.jsアプリのURL設定
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3001';

// 全テスト開始前の初期化
beforeAll(async () => {
  console.log('🔧 統合テスト環境を初期化中...');

  // MSWサーバーを停止（統合テストでは実際のFirebase Emulatorを使用）
  server.close();
  console.log('🔇 MSWサーバーを停止しました');

  // Firebase Emulatorが起動していることを確認
  try {
    await initializeTestDatabase();
    console.log('✅ 統合テスト環境の初期化が完了しました');
  } catch (error) {
    console.error('❌ 統合テスト環境の初期化に失敗:', error);
    throw error;
  }
}, 60000); // 60秒のタイムアウト

// 各テスト前のデータクリア
beforeEach(async () => {
  await clearTestData();
  await initializeTestDatabase();
}, 30000);

// 全テスト完了後のクリーンアップ
afterAll(async () => {
  console.log('🧹 統合テスト環境をクリーンアップ中...');
  await clearTestData();
  console.log('✅ 統合テスト環境のクリーンアップが完了しました');
}, 30000);
