#!/usr/bin/env node

/**
 * E2Eテストで作成されたテストユーザーをクリーンアップするスクリプト
 * Docker開発環境のFirebase Emulatorに接続して、newuser- で始まるアカウントを削除
 */

import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import readline from 'readline';

// Firebase Admin SDKの初期化
if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error('❌ FIRESTORE_EMULATOR_HOST環境変数が設定されていません');
  console.log('💡 Docker環境で実行してください: npm run docker:dev');
  process.exit(1);
}

console.log('🔗 Firebase Emulator接続中...');
initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID || 'todoapp-next-dev',
});

const auth = getAuth();

async function cleanupTestUsers() {
  try {
    console.log('👥 全ユーザーを取得中...');

    // すべてのユーザーを取得
    const listUsersResult = await auth.listUsers();
    const allUsers = listUsersResult.users;

    console.log(`📊 全ユーザー数: ${allUsers.length}`);

    // newuser- で始まるユーザーをフィルタリング
    const testUsers = allUsers.filter(
      (user) => user.email && user.email.startsWith('newuser-'),
    );

    if (testUsers.length === 0) {
      console.log(
        '✅ クリーンアップ対象のテストユーザーは見つかりませんでした',
      );
      return;
    }

    console.log(`\n🗑️  削除対象のテストユーザー: ${testUsers.length}件`);
    testUsers.forEach((user) => {
      console.log(`  - ${user.email} (UID: ${user.uid})`);
    });

    // 確認プロンプト
    console.log('\n❓ これらのユーザーを削除しますか？ (y/N)');

    // 標準入力から確認を取得
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('', async (answer: string) => {
      if (answer.toLowerCase() !== 'y') {
        console.log('❌ キャンセルしました');
        rl.close();
        process.exit(0);
      }

      console.log('\n🧹 テストユーザーを削除中...');

      let deletedCount = 0;
      let errorCount = 0;

      for (const user of testUsers) {
        try {
          await auth.deleteUser(user.uid);
          console.log(`✅ 削除完了: ${user.email}`);
          deletedCount++;
        } catch (error) {
          console.error(`❌ 削除失敗: ${user.email}`, error);
          errorCount++;
        }
      }

      console.log(`\n✨ クリーンアップ完了`);
      console.log(`  - 削除成功: ${deletedCount}件`);
      if (errorCount > 0) {
        console.log(`  - 削除失敗: ${errorCount}件`);
      }

      rl.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプト実行
cleanupTestUsers();
