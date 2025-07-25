/**
 * テストデータベースクリーンアップスクリプト
 * Firebase Emulatorのテストデータを削除するためのスクリプト
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { TEST_ACCOUNTS } from '@/todoApp-submodule/mocks/data/master/firebase/export_my_data';

// Firebase Admin SDKの初期化（Docker Emulator専用）
if (getApps().length === 0) {
  // Docker環境でのFirebase Emulator接続専用
  console.log(`🔗 Firebase接続先: ${process.env.FIRESTORE_EMULATOR_HOST}`);
  console.log(
    `🔑 認証モード: Emulator (${process.env.FIREBASE_AUTH_EMULATOR_HOST})`,
  );

  initializeApp({
    projectId: 'todoapp-test',
  });
}

const db = getFirestore();
const auth = getAuth();

/**
 * 指定ユーザーのテストデータをクリアする共通関数
 */
async function clearUserData(uid: string) {
  const userRef = db.collection('users').doc(uid);

  // Todosサブコレクションの削除
  const todosSnapshot = await userRef.collection('todos').get();
  const todosBatch = db.batch();
  todosSnapshot.docs.forEach((doc) => {
    todosBatch.delete(doc.ref);
  });
  await todosBatch.commit();

  // Listsサブコレクションの削除
  const listsSnapshot = await userRef.collection('lists').get();
  const listsBatch = db.batch();
  listsSnapshot.docs.forEach((doc) => {
    listsBatch.delete(doc.ref);
  });
  await listsBatch.commit();

  // ユーザードキュメントの削除
  await userRef.delete();

  // Firebase Authユーザーの削除
  try {
    await auth.deleteUser(uid);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // ユーザーが存在しない場合は無視
  }
}

/**
 * 全テストデータをクリア
 */
export async function clearTestData() {
  try {
    console.log('🧹 テストデータをクリア中...');

    // TEST_ACCOUNTSで管理されているテストユーザーのデータクリア
    const testUserEmails = TEST_ACCOUNTS.map((account) => account.email);

    for (const email of testUserEmails) {
      try {
        // メールアドレスからUIDを取得
        const userRecord = await auth.getUserByEmail(email);
        await clearUserData(userRecord.uid);
        console.log(`✅ ユーザー ${email} のデータをクリアしました`);
      } catch (error) {
        if ((error as { code?: string }).code === 'auth/user-not-found') {
          console.log(`ℹ️ ユーザー ${email} は存在しません`);
        } else {
          console.error(`❌ ユーザー ${email} のクリア中にエラー:`, error);
        }
      }
    }

    console.log('✅ テストデータがクリアされました');
  } catch (error) {
    console.error('❌ データクリアエラー:', error);
    throw error;
  }
}

/**
 * 指定ユーザーのデータのみクリア
 */
export async function clearUserDataByEmail(email: string) {
  try {
    console.log(`🧹 ユーザー ${email} のデータをクリア中...`);

    const userRecord = await auth.getUserByEmail(email);
    await clearUserData(userRecord.uid);

    console.log(`✅ ユーザー ${email} のデータがクリアされました`);
  } catch (error) {
    if ((error as { code?: string }).code === 'auth/user-not-found') {
      console.log(`ℹ️ ユーザー ${email} は存在しません`);
    } else {
      console.error(`❌ ユーザー ${email} のクリア中にエラー:`, error);
      throw error;
    }
  }
}

// スクリプトとして直接実行された場合
if (require.main === module) {
  clearTestData()
    .then(() => {
      console.log('🎉 テストデータのクリーンアップが完了しました');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 クリーンアップに失敗しました:', error);
      process.exit(1);
    });
}
