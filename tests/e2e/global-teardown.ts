import { FullConfig } from '@playwright/test';
import { clearTestData } from '../setup-db';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function globalTeardown(config: FullConfig) {
  console.log('🧹 E2Eテストのグローバルクリーンアップを開始...');

  try {
    // テストデータのクリア
    await clearTestData();
    console.log('✅ E2Eテスト用データベースがクリアされました');

    console.log('🎉 E2Eテストのグローバルクリーンアップが完了しました');
  } catch (error) {
    console.error('❌ E2Eテストのグローバルクリーンアップに失敗:', error);
    // クリーンアップの失敗は致命的ではないため、プロセスは継続
  }
}

export default globalTeardown;
