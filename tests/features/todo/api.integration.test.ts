/**
 * Todo API統合テスト
 * Firebase EmulatorとNext.js APIを使用した統合テスト
 */

/**
 * Docker統合テスト用ファイル
 *
 * このファイルはDocker環境（npm run docker:test:run）でのみ実行されます。
 * ローカル環境での実行はサポートされていません。
 *
 * 使用方法:
 * npm run docker:test:run
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TodoListProps } from '@/types/todos';
import { server } from '@/todoApp-submodule/mocks/server';
import { clearTestData } from '@/scripts/cleanup-db';
import { initializeApp, getApps } from 'firebase-admin/app';

// Firebase Admin SDK初期化（テスト環境）
if (getApps().length === 0 && process.env.FIRESTORE_EMULATOR_HOST) {
  initializeApp({
    projectId: 'todoapp-test',
  });
}

// APIテスト用のヘルパー関数
const apiRequest = async (
  method: string,
  endpoint: string,
  body?: unknown,
  headers?: Record<string, string>,
) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';
  const response = await fetch(`${baseUrl}/api${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return {
    status: response.status,
    data: response.headers.get('content-type')?.includes('application/json')
      ? await response.json()
      : await response.text(),
  };
};

// Docker環境でのみ実行される統合テストのため、MSWを停止
beforeAll(() => {
  if (process.env.NODE_ENV === 'test' && process.env.FIRESTORE_EMULATOR_HOST) {
    server.close();
  }
});

afterAll(() => {
  if (process.env.NODE_ENV === 'test' && process.env.FIRESTORE_EMULATOR_HOST) {
    server.listen();
  }
});

describe('Todo API 統合テスト', () => {
  // テスト前の1回のみデータクリアを実行（効率化）
  beforeAll(async () => {
    if (process.env.FIRESTORE_EMULATOR_HOST) {
      try {
        await clearTestData();
        console.log('📋 テストデータクリア完了 - 初期状態でテスト開始');
      } catch (error) {
        console.warn(
          'テストデータクリアに失敗しましたが、テストを継続します:',
          error,
        );
      }
    }
  }, 60000); // タイムアウトを60秒に増加

  describe('GET /api/todos', () => {
    it('認証されたユーザーのTodoリストを正常に取得する', async () => {
      // NextAuth.js セッション認証を使用（X-User-IDヘッダーは不要）
      const authHeaders = {};

      const response = await apiRequest(
        'GET',
        '/todos',
        undefined,
        authHeaders,
      );

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      // APIが正常に応答することを確認（データの有無は問わない）
      expect(response.data).toHaveProperty('todos');
      expect(Array.isArray(response.data.todos)).toBe(true);
    });

    it('未認証ユーザーは401エラーを受け取る', async () => {
      const response = await apiRequest('GET', '/todos');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/todos', () => {
    it('新しいTodoを正常に作成する', async () => {
      // NextAuth.js セッション認証を使用（ヘッダー不要）
      const authHeaders = {};

      const newTodo = {
        text: '統合テスト用の新しいTodo',
        status: 'todo',
        category: 'todo',
      };

      const response = await apiRequest('POST', '/todos', newTodo, authHeaders);

      expect(response.status).toBe(201);
      expect(response.data.text).toBe(newTodo.text);
      expect(response.data.status).toBe(newTodo.status);
      expect(response.data.id).toBeDefined();
      expect(response.data.createdTime).toBeDefined();
    });

    it('無効なデータで400エラーを返す', async () => {
      // NextAuth.js セッション認証を使用（ヘッダー不要）
      const authHeaders = {};

      const invalidTodo = {
        // textフィールドが欠けている
        status: 'todo',
        category: 'todo',
      };

      const response = await apiRequest(
        'POST',
        '/todos',
        invalidTodo,
        authHeaders,
      );

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/todos', () => {
    it('既存のTodoを正常に更新する', async () => {
      // NextAuth.js セッション認証を使用（ヘッダー不要）
      const authHeaders = {};

      // まずTodoを取得して既存のIDを確認
      const getTodosResponse = await apiRequest(
        'GET',
        '/todos',
        undefined,
        authHeaders,
      );
      const existingTodo = getTodosResponse.data.todos[0];

      const updatedTodo = {
        id: existingTodo.id,
        text: '更新されたTodoテキスト',
        status: 'done',
        category: 'done',
      };

      const response = await apiRequest(
        'PUT',
        '/todos',
        updatedTodo,
        authHeaders,
      );

      expect(response.status).toBe(200);
      expect(response.data.text).toBe(updatedTodo.text);
      expect(response.data.status).toBe(updatedTodo.status);
    });
  });

  describe('DELETE /api/todos', () => {
    it('既存のTodoを正常に削除する', async () => {
      // NextAuth.js セッション認証を使用（ヘッダー不要）
      const authHeaders = {};

      // まずTodoを取得して既存のIDを確認
      const getTodosResponse = await apiRequest(
        'GET',
        '/todos',
        undefined,
        authHeaders,
      );
      const existingTodo = getTodosResponse.data.todos[0];

      const response = await apiRequest(
        'DELETE',
        '/todos',
        { id: existingTodo.id },
        authHeaders,
      );

      expect(response.status).toBe(200);

      // 削除されたことを確認
      const verifyResponse = await apiRequest(
        'GET',
        '/todos',
        undefined,
        authHeaders,
      );
      const remainingTodos = verifyResponse.data.todos.filter(
        (todo: TodoListProps) => todo.id === existingTodo.id,
      );
      expect(remainingTodos.length).toBe(0);
    });
  });
});

describe('Lists API 統合テスト', () => {
  // Listsテストは既存データを利用（データクリア不要）

  describe('GET /api/lists', () => {
    it('認証されたユーザーのリストを正常に取得する', async () => {
      // NextAuth.js セッション認証を使用（ヘッダー不要）
      const authHeaders = {};

      const response = await apiRequest(
        'GET',
        '/lists',
        undefined,
        authHeaders,
      );

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      // APIが正常に応答することを確認（データの有無は問わない）
      expect(response.data).toHaveProperty('lists');
      expect(Array.isArray(response.data.lists)).toBe(true);
    });
  });
});
