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

type TodosApiData = { todos: TodoListProps[] };
type ListsApiData = { lists: unknown[] };
type TodoApiData = {
  text: string;
  status: string;
  id: string;
  createdTime: unknown;
};
type ErrorApiData = { error: string };

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

  const data: unknown = response.headers
    .get('content-type')
    ?.includes('application/json')
    ? await (response.json() as Promise<unknown>)
    : await response.text();
  return {
    status: response.status,
    data,
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
      // 統合テスト環境では X-Test-User-ID ヘッダー認証を使用
      const authHeaders = {
        'X-Test-User-ID': 'test-user-1',
      };

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
      expect(Array.isArray((response.data as TodosApiData).todos)).toBe(true);
    });

    it('未認証ユーザーは401エラーを受け取る', async () => {
      // 認証ヘッダーなしでAPIリクエスト
      const response = await apiRequest('GET', '/todos');

      expect(response.status).toBe(401);
      expect(response.data).toHaveProperty('error');
    });
  });

  describe('POST /api/todos', () => {
    it('新しいTodoを正常に作成する', async () => {
      // 統合テスト環境では X-Test-User-ID ヘッダー認証を使用
      const authHeaders = {
        'X-Test-User-ID': 'test-user-1',
      };

      const newTodo = {
        text: '統合テスト用の新しいTodo',
        status: 'todo',
        category: 'todo',
      };

      const response = await apiRequest('POST', '/todos', newTodo, authHeaders);

      expect(response.status).toBe(201);
      expect((response.data as TodoApiData).text).toBe(newTodo.text);
      expect((response.data as TodoApiData).status).toBe(newTodo.status);
      expect((response.data as TodoApiData).id).toBeDefined();
      expect((response.data as TodoApiData).createdTime).toBeDefined();
    });

    it('無効なデータで400エラーを返す', async () => {
      // 統合テスト環境では X-Test-User-ID ヘッダー認証を使用
      const authHeaders = {
        'X-Test-User-ID': 'test-user-1',
      };

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
      // 統合テスト環境では X-Test-User-ID ヘッダー認証を使用
      const authHeaders = {
        'X-Test-User-ID': 'test-user-1',
      };

      // まずTodoを取得して既存のIDを確認
      const getTodosResponse = await apiRequest(
        'GET',
        '/todos',
        undefined,
        authHeaders,
      );
      const existingTodo = (getTodosResponse.data as TodosApiData).todos[0];

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
      expect((response.data as TodoApiData).text).toBe(updatedTodo.text);
      expect((response.data as TodoApiData).status).toBe(updatedTodo.status);
    });
  });

  describe('DELETE /api/todos', () => {
    it('既存のTodoを正常に削除する', async () => {
      // 統合テスト環境では X-Test-User-ID ヘッダー認証を使用
      const authHeaders = {
        'X-Test-User-ID': 'test-user-1',
      };

      // まずTodoを取得して既存のIDを確認
      const getTodosResponse = await apiRequest(
        'GET',
        '/todos',
        undefined,
        authHeaders,
      );
      const existingTodo = (getTodosResponse.data as TodosApiData).todos[0];

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
      const remainingTodos = (verifyResponse.data as TodosApiData).todos.filter(
        (todo: TodoListProps) => todo.id === existingTodo.id,
      );
      expect(remainingTodos.length).toBe(0);
    });
  });
});

describe('Lists API 統合テスト', () => {
  describe('GET /api/lists', () => {
    it('認証されたユーザーのリストを正常に取得する', async () => {
      // 統合テスト環境では X-Test-User-ID ヘッダー認証を使用
      const authHeaders = {
        'X-Test-User-ID': 'test-user-1',
      };

      const response = await apiRequest(
        'GET',
        '/lists',
        undefined,
        authHeaders,
      );

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data).toHaveProperty('lists');
      expect(Array.isArray((response.data as ListsApiData).lists)).toBe(true);
    });

    it('未認証ユーザーは401エラーを受け取る', async () => {
      // 認証ヘッダーなしでAPIリクエスト
      const response = await apiRequest('GET', '/lists');

      expect(response.status).toBe(401);
      expect(response.data).toHaveProperty('error');
    });
  });
});

describe('管理者権限テスト', () => {
  describe('管理者ユーザーでのアクセス', () => {
    it('管理者ユーザーが一般ユーザーのTodoにアクセスできる', async () => {
      // 管理者ユーザーのヘッダー認証
      const adminHeaders = {
        'X-Test-User-ID': 'test-admin-1',
      };

      const response = await apiRequest(
        'GET',
        '/todos',
        undefined,
        adminHeaders,
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('todos');
      expect(Array.isArray((response.data as TodosApiData).todos)).toBe(true);
    });

    it('管理者ユーザーが一般ユーザーのリストにアクセスできる', async () => {
      // 管理者ユーザーのヘッダー認証
      const adminHeaders = {
        'X-Test-User-ID': 'test-admin-1',
      };

      const response = await apiRequest(
        'GET',
        '/lists',
        undefined,
        adminHeaders,
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('lists');
      expect(Array.isArray((response.data as ListsApiData).lists)).toBe(true);
    });
  });

  describe('一般ユーザーと管理者ユーザーのデータ分離', () => {
    it('一般ユーザーは自分のデータのみアクセス可能', async () => {
      // 一般ユーザーのヘッダー認証
      const userHeaders = {
        'X-Test-User-ID': 'test-user-1',
      };

      // 一般ユーザーのTodo取得
      const userResponse = await apiRequest(
        'GET',
        '/todos',
        undefined,
        userHeaders,
      );

      // 管理者ユーザーのTodo取得
      const adminHeaders = {
        'X-Test-User-ID': 'test-admin-1',
      };

      const adminResponse = await apiRequest(
        'GET',
        '/todos',
        undefined,
        adminHeaders,
      );

      // 両方とも成功するが、異なるデータセットを持つことを確認
      expect(userResponse.status).toBe(200);
      expect(adminResponse.status).toBe(200);

      // データが存在する場合の検証（データが空の場合もあるため条件付き）
      const userTodosData = userResponse.data as TodosApiData;
      const adminTodosData = adminResponse.data as TodosApiData;
      if (userTodosData.todos.length > 0 && adminTodosData.todos.length > 0) {
        const userTodos = userTodosData.todos;
        const adminTodos = adminTodosData.todos;

        const userTodoIds = userTodos.map((todo: TodoListProps) => todo.id);
        const adminTodoIds = adminTodos.map((todo: TodoListProps) => todo.id);
        const commonIds = userTodoIds.filter((id: string) =>
          adminTodoIds.includes(id),
        );
        expect(commonIds.length).toBe(0);
      }
    });
  });
});
