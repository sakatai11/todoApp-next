#!/usr/bin/env node

/**
 * E2Eテストで作成されたテストユーザーを自動クリーンアップするスクリプト
 * Docker開発環境のFirebase Emulatorに接続して、newuser- で始まるアカウントを削除
 *
 * 使用方法:
 * - デフォルト: 確認プロンプトあり
 * - --auto フラグ付き: 確認なしで即座に削除
 *
 * 例:
 * FIRESTORE_EMULATOR_HOST=localhost:8080 \
 * FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 \
 * tsx scripts/auto-cleanup-test-users.ts --auto
 */

import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import readline from 'readline';

// 環境変数の必須チェック
if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error('❌ FIRESTORE_EMULATOR_HOST環境変数が設定されていません');
  console.log('💡 Docker環境で実行してください: npm run docker:dev');
  process.exit(1);
}

// --auto フラグの検出
const isAutoMode = process.argv.includes('--auto');

console.log('🔗 Firebase Emulator接続中...');
initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID || 'todoapp-next-dev',
});

const auth = getAuth();

async function cleanupTestUsers() {
  try {
    console.log('🧹 テストユーザーをクリーンアップ中...');

    // すべてのユーザーを取得
    const listUsersResult = await auth.listUsers();
    const allUsers = listUsersResult.users;

    // newuser- で始まるユーザーをフィルタリング
    const testUsers = allUsers.filter(
      (user) => user.email && user.email.startsWith('newuser-'),
    );

    if (testUsers.length === 0) {
      console.log(
        '✅ クリーンアップ対象のテストユーザーは見つかりませんでした',
      );
      process.exit(0);
    }

    // 自動モードでなければ確認を取得
    if (!isAutoMode) {
      console.log(`\n🗑️  削除対象のテストユーザー: ${testUsers.length}件`);
      testUsers.forEach((user) => {
        console.log(`  - ${user.email} (UID: ${user.uid})`);
      });
      console.log('\n❓ これらのユーザーを削除しますか？ (y/N)');

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

        rl.close();
        await performCleanup(testUsers);
      });
    } else {
      // 自動モード: 即座に削除実行
      await performCleanup(testUsers);
    }
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

async function performCleanup(testUsers: any[]) {
  let deletedCount = 0;
  let errorCount = 0;

  for (const user of testUsers) {
    try {
      await auth.deleteUser(user.uid);
      deletedCount++;
    } catch (error) {
      errorCount++;
    }
  }

  console.log(`✨ 完了: ${deletedCount}件削除, ${errorCount}件失敗`);

  if (errorCount > 0) {
    process.exit(1);
  }

  process.exit(0);
}

// スクリプト実行
cleanupTestUsers();
