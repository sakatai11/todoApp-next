/**
 * テストデータベース初期化スクリプト
 * Firebase Emulatorに初期データを投入するためのスクリプト
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import {
  mockTodos,
  mockLists,
  mockUser,
} from '../todoApp-submodule/mocks/data';

// Firebase Admin SDKの初期化（エミュレーター用）
if (getApps().length === 0) {
  // エミュレーター環境では認証情報は不要
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8081';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9100';

  initializeApp({
    projectId: 'todoapp-test',
  });
}

const db = getFirestore();
const auth = getAuth();

/**
 * テストユーザーの作成
 */
export async function createTestUsers() {
  try {
    // テスト用ユーザーの作成
    const testUser = await auth.createUser({
      uid: 'test-user-1',
      email: 'test@example.com',
      password: 'testpassword123',
      emailVerified: true,
    });

    // カスタムクレームを別途設定
    await auth.setCustomUserClaims('test-user-1', { role: 'user' });

    // テスト用管理者の作成
    const testAdmin = await auth.createUser({
      uid: 'test-admin-1',
      email: 'admin@example.com',
      password: 'adminpassword123',
      emailVerified: true,
    });

    // カスタムクレームを別途設定
    await auth.setCustomUserClaims('test-admin-1', { role: 'admin' });

    console.log('✅ テストユーザーが作成されました');
    return { testUser, testAdmin };
  } catch (error) {
    console.error('❌ ユーザー作成エラー:', error);
    throw error;
  }
}

/**
 * テストデータの投入
 */
export async function seedTestData() {
  try {
    const batch = db.batch();

    // ユーザー情報の投入
    const userRef = db.collection('users').doc('test-user-1');
    batch.set(userRef, {
      ...mockUser,
      uid: 'test-user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // リストデータの投入（ユーザーのサブコレクションとして）
    mockLists.forEach((list) => {
      const listRef = db
        .collection('users')
        .doc('test-user-1')
        .collection('lists')
        .doc(list.id);
      batch.set(listRef, {
        ...list,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    // Todoデータの投入（ユーザーのサブコレクションとして）
    mockTodos.forEach((todo) => {
      const todoRef = db
        .collection('users')
        .doc('test-user-1')
        .collection('todos')
        .doc(todo.id);
      batch.set(todoRef, {
        ...todo,
        // APIで期待されるTimestamp形式に変換
        createdTime: Timestamp.fromDate(new Date(todo.createdTime)),
        updateTime: Timestamp.fromDate(new Date(todo.updateTime)),
      });
    });

    await batch.commit();
    console.log('✅ テストデータが投入されました');
  } catch (error) {
    console.error('❌ データ投入エラー:', error);
    throw error;
  }
}

/**
 * テストデータベースのクリア
 */
export async function clearTestData() {
  try {
    // ユーザーのサブコレクションを削除
    const userRef = db.collection('users').doc('test-user-1');

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

    // テストユーザーの削除
    try {
      await auth.deleteUser('test-user-1');
      await auth.deleteUser('test-admin-1');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // ユーザーが存在しない場合は無視
    }

    console.log('✅ テストデータがクリアされました');
  } catch (error) {
    console.error('❌ データクリアエラー:', error);
    throw error;
  }
}

/**
 * テストデータベース全体の初期化
 */
export async function initializeTestDatabase() {
  try {
    console.log('🚀 テストデータベースを初期化中...');

    // データクリア
    await clearTestData();

    // ユーザー作成
    await createTestUsers();

    // テストデータ投入
    await seedTestData();

    console.log('✅ テストデータベースの初期化が完了しました');
  } catch (error) {
    console.error('❌ テストデータベース初期化エラー:', error);
    throw error;
  }
}

// スクリプトとして直接実行された場合
if (require.main === module) {
  initializeTestDatabase()
    .then(() => {
      console.log('🎉 テストデータベースの準備が完了しました');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 初期化に失敗しました:', error);
      process.exit(1);
    });
}
