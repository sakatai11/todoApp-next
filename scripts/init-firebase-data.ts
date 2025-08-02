#!/usr/bin/env node

/**
 * Firebase Emulatorの初期データ投入スクリプト
 * docker:test実行時にユーザー情報とテストデータを作成
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import {
  shouldUseTestDbData,
  fetchTestDbUserData,
  fetchTestDbTodoDataByUserId,
  fetchTestDbListDataByUserId,
} from '@/scripts/helpers/testDbDataFetcher';
import { TEST_ACCOUNTS } from '@/todoApp-submodule/mocks/data/master/firebase/export_test_data';

// Firebase Admin SDKの初期化
if (process.env.FIRESTORE_EMULATOR_HOST) {
  console.log('🔗 Firebase Emulator接続中...');
  initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'todoapp-test',
  });
} else {
  console.error('❌ FIRESTORE_EMULATOR_HOST環境変数が設定されていません');
  process.exit(1);
}

const db = getFirestore();
const auth = getAuth();

async function createInitialData() {
  try {
    console.log('📝 初期データ作成を開始...');

    // テスト環境DBデータの取得
    if (!shouldUseTestDbData()) {
      throw new Error(
        'テスト環境DBデータ使用が無効になっています。USE_TEST_DB_DATA=trueを設定してください。',
      );
    }

    console.log('🔄 テスト環境DBからユーザーデータを取得中...');
    const users = await fetchTestDbUserData();

    if (!users.length) {
      throw new Error('テスト環境DBからユーザーデータを取得できませんでした。');
    }

    console.log('✅ テスト環境DBユーザーデータの取得が完了しました');

    // Firestoreデータの作成
    let batch = db.batch();

    // Firebase Authユーザーの作成
    console.log('👤 テストユーザーを作成中...');
    const createdUsers = [];
    for (const user of users) {
      const testAccount = TEST_ACCOUNTS.find(
        (account) => account.email === user.email,
      );

      if (!testAccount) {
        console.warn(`⚠️ テストアカウント情報が見つかりません: ${user.email}`);
        continue;
      }

      try {
        const createdUser = await auth.createUser({
          uid: user.id,
          email: testAccount.email,
          password: testAccount.password,
          displayName: user.name,
          emailVerified: true,
        });
        console.log(`✅ ユーザー ${testAccount.email} が作成されました`);
        createdUsers.push(createdUser);
      } catch (error) {
        const firebaseError = error as { code?: string; message?: string };
        if (firebaseError.code === 'auth/uid-already-exists') {
          console.log(`ℹ️ ユーザー ${testAccount.email} は既に存在します`);
        } else if (firebaseError.code === 'auth/email-already-exists') {
          console.log(
            `ℹ️ メールアドレス ${testAccount.email} は既に使用されています`,
          );
        } else if (firebaseError.code === 'auth/weak-password') {
          console.error(`❌ パスワードが弱すぎます: ${testAccount.email}`);
          throw error;
        } else {
          console.error(
            `❌ ユーザー ${testAccount.email} の作成中にエラー (${firebaseError.code}):`,
            firebaseError.message || error,
          );
          throw error;
        }
      }
    }

    // Firestoreデータの投入（ユーザーごとに個別データ）
    console.log('📊 Firestoreデータを投入中...');
    let batchOperationCount = 0;
    const MAX_BATCH_SIZE = 450; // 安全マージンを考慮

    for (const userData of users) {
      const userRef = db.collection('users').doc(userData.id);
      batch.set(userRef, userData);
      batchOperationCount++;

      // ユーザー個別のリストデータを取得・投入
      const userLists = await fetchTestDbListDataByUserId(userData.id);
      for (const list of userLists) {
        if (batchOperationCount >= MAX_BATCH_SIZE) {
          // バッチをコミットして新しいバッチを開始
          await batch.commit();
          batch = db.batch();
          batchOperationCount = 0;
        }
        const listRef = userRef.collection('lists').doc(list.id);
        batch.set(listRef, {
          ...list,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        batchOperationCount++;
      }
      console.log(
        `✅ ユーザー ${userData.name} の${userLists.length}件のリストデータを投入`,
      );

      // ユーザー個別のTodoデータを取得・投入
      const userTodos = await fetchTestDbTodoDataByUserId(userData.id);
      for (const todo of userTodos) {
        if (batchOperationCount >= MAX_BATCH_SIZE) {
          await batch.commit();
          batch = db.batch();
          batchOperationCount = 0;
        }
        const todoRef = userRef.collection('todos').doc(todo.id);
        batch.set(todoRef, {
          ...todo,
          createdTime: todo.createdTime,
          updateTime: todo.updateTime,
        });
        batchOperationCount++;
      }
      console.log(
        `✅ ユーザー ${userData.name} の${userTodos.length}件のTodoデータを投入`,
      );
    }

    if (batchOperationCount > 0) {
      await batch.commit();
    }
    console.log('✅ 全ユーザーのテストデータを個別に投入しました');
  } catch (error) {
    console.error('❌ 初期データ作成エラー:', error);
    throw error;
  }
}

async function main() {
  try {
    await createInitialData();
    console.log('🎉 Firebase Emulator初期データ投入完了');
    process.exit(0);
  } catch (error) {
    console.error('💥 初期化に失敗しました:', error);
    process.exit(1);
  }
}

// スクリプト実行
main();
