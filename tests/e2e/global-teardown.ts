import { FullConfig } from '@playwright/test';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

/**
 * Playwright globalTeardown
 * E2Eテスト完了後に自動的にテストユーザーをクリーンアップ
 *
 * 実行タイミング:
 * - すべてのE2Eテスト完了後
 * - テスト成功・失敗に関わらず実行
 *
 * 削除対象:
 * - newuser- で始まるメールアドレスのユーザー
 */
export default async function globalTeardown(config: FullConfig) {
  console.log('🧹 E2Eテスト完了後のクリーンアップ...');

  // Emulator環境確認
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    console.log('ℹ️  Emulator環境でないためスキップ');
    return;
  }

  try {
    // Firebase Admin SDK初期化
    initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'todoapp-next-dev',
    });

    const auth = getAuth();

    // newuser-* ユーザーを検索
    const listUsersResult = await auth.listUsers();
    const testUsers = listUsersResult.users.filter(
      (user) => user.email && user.email.startsWith('newuser-'),
    );

    if (testUsers.length === 0) {
      console.log('✅ クリーンアップ対象なし');
      return;
    }

    // 削除実行（並列処理）
    let deleted = 0;
    let failed = 0;

    await Promise.all(
      testUsers.map(async (user) => {
        try {
          await auth.deleteUser(user.uid);
          deleted++;
        } catch (error) {
          failed++;
        }
      }),
    );

    console.log(`✨ 完了: ${deleted}件削除, ${failed}件失敗`);
  } catch (error) {
    // エラーが発生してもテスト結果には影響させない
    console.error('⚠️  クリーンアップエラー:', error);
  }
}
