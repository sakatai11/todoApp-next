import { chromium, FullConfig } from '@playwright/test';
import { initializeTestDatabase } from '../setup-db';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function globalSetup(config: FullConfig) {
  console.log('🚀 E2Eテストのグローバルセットアップを開始...');

  // 環境変数の設定
  (process.env as Record<string, string | undefined>).NODE_ENV = 'test';
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8081';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9100';
  process.env.FIREBASE_PROJECT_ID = 'todoapp-test';

  try {
    // テストデータベースの初期化
    await initializeTestDatabase();
    console.log('✅ E2Eテスト用データベースが初期化されました');

    // ブラウザの起動確認
    const browser = await chromium.launch();
    await browser.close();
    console.log('✅ ブラウザの起動確認が完了しました');

    console.log('🎉 E2Eテストのグローバルセットアップが完了しました');
  } catch (error) {
    console.error('❌ E2Eテストのグローバルセットアップに失敗:', error);
    throw error;
  }
}

export default globalSetup;
