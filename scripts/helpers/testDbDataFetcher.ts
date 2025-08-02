/**
 * ローカルテストデータからテストデータを取得するためのユーティリティ
 * エクスポートされたローカルデータファイルからデータを取得
 */

import {
  TEST_ACCOUNTS,
  EXPORTED_USERS,
  getTodosByUserId,
  getListsByUserId,
} from '@/todoApp-submodule/mocks/data/master/firebase/export_test_data';
import { UserData } from '@/types/auth/authData';
import { TodoListProps } from '@/types/todos';
import { StatusListProps } from '@/types/lists';

/**
 * テスト環境DBからユーザーデータを取得
 */
export async function fetchTestDbUserData(): Promise<UserData[]> {
  try {
    console.log('📄 ローカルテストデータからユーザーデータを取得中...');

    // TEST_ACCOUNTSで指定されたユーザーのみ返す
    const filteredUsers = EXPORTED_USERS.filter((user) =>
      TEST_ACCOUNTS.some((account) => account.email === user.email),
    );

    console.log(`✅ ${filteredUsers.length}件のユーザーデータを取得しました`);
    return filteredUsers;
  } catch (error) {
    console.error('❌ テスト環境DBデータ取得エラー:', error);
    throw error;
  }
}

/**
 * テスト環境DBからTodoデータを取得（全ユーザー）
 */
export async function fetchTestDbTodoData(): Promise<TodoListProps[]> {
  try {
    console.log('📄 ローカルテストデータからTodoデータを取得中...');

    // 全ユーザーのTodoデータを取得
    const filteredUsers = EXPORTED_USERS.filter((user) =>
      TEST_ACCOUNTS.some((account) => account.email === user.email),
    );

    const allTodos: TodoListProps[] = [];
    for (const user of filteredUsers) {
      const userTodos = getTodosByUserId(user.id);
      allTodos.push(...userTodos);
      console.log(
        `✅ ユーザー ${user.name} の${userTodos.length}件のTodoデータを取得`,
      );
    }

    console.log(`✅ 合計${allTodos.length}件のTodoデータを取得しました`);
    return allTodos;
  } catch (error) {
    console.error('❌ テスト環境DB Todoデータ取得エラー:', error);
    throw error;
  }
}

/**
 * テスト環境DBからリストデータを取得（全ユーザー）
 */
export async function fetchTestDbListData(): Promise<StatusListProps[]> {
  try {
    console.log('📄 ローカルテストデータからリストデータを取得中...');

    // 全ユーザーのリストデータを取得
    const filteredUsers = EXPORTED_USERS.filter((user) =>
      TEST_ACCOUNTS.some((account) => account.email === user.email),
    );

    const allLists: StatusListProps[] = [];
    for (const user of filteredUsers) {
      const userLists = getListsByUserId(user.id);
      allLists.push(...userLists);
      console.log(
        `✅ ユーザー ${user.name} の${userLists.length}件のリストデータを取得`,
      );
    }

    console.log(`✅ 合計${allLists.length}件のリストデータを取得しました`);
    return allLists;
  } catch (error) {
    console.error('❌ テスト環境DB リストデータ取得エラー:', error);
    throw error;
  }
}

/**
 * テスト環境DBデータを使用するかどうかの判定
 */
export function shouldUseTestDbData(): boolean {
  return process.env.USE_TEST_DB_DATA === 'true';
}

/**
 * 特定ユーザーのTodoデータを取得（テスト用）
 */
export async function fetchTestDbTodoDataByUserId(
  userId: string,
): Promise<TodoListProps[]> {
  try {
    console.log(`📄 ユーザーID: ${userId} のTodoデータを取得中...`);

    const userTodos = getTodosByUserId(userId);
    console.log(`✅ ${userTodos.length}件のTodoデータを取得しました`);
    return userTodos;
  } catch (error) {
    console.error('❌ Todoデータ取得エラー:', error);
    throw error;
  }
}

/**
 * 特定ユーザーのリストデータを取得（テスト用）
 */
export async function fetchTestDbListDataByUserId(
  userId: string,
): Promise<StatusListProps[]> {
  try {
    console.log(`📄 ユーザーID: ${userId} のリストデータを取得中...`);

    const userLists = getListsByUserId(userId);
    console.log(`✅ ${userLists.length}件のリストデータを取得しました`);
    return userLists;
  } catch (error) {
    console.error('❌ リストデータ取得エラー:', error);
    throw error;
  }
}
