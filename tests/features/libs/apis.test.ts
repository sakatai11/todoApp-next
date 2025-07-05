import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiRequest } from '@/features/libs/apis';

// fetchのモック
const createMockResponse = (data: unknown, ok = true, status = 200) => ({
  ok,
  status,
  json: vi.fn().mockResolvedValue(data),
});

describe('apiRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // console.errorをモックして不要なログを抑制
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('正常なリクエスト', () => {
    it('POSTリクエストが正常に実行される', async () => {
      const mockResponseData = { id: '1', message: 'Success' };
      const mockRequestBody = { text: 'Test todo', status: 'pending' };

      global.fetch = vi
        .fn()
        .mockResolvedValue(createMockResponse(mockResponseData));

      const result = await apiRequest('/api/todos', 'POST', mockRequestBody);

      expect(fetch).toHaveBeenCalledWith('/api/todos', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
        body: JSON.stringify(mockRequestBody),
      });

      expect(result).toEqual(mockResponseData);
    });

    it('PUTリクエストが正常に実行される', async () => {
      const mockResponseData = { success: true };
      const mockRequestBody = { id: '1', text: 'Updated todo' };

      global.fetch = vi
        .fn()
        .mockResolvedValue(createMockResponse(mockResponseData));

      const result = await apiRequest('/api/todos', 'PUT', mockRequestBody);

      expect(fetch).toHaveBeenCalledWith('/api/todos', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
        body: JSON.stringify(mockRequestBody),
      });

      expect(result).toEqual(mockResponseData);
    });

    it('DELETEリクエストが正常に実行される', async () => {
      const mockResponseData = { deleted: true };
      const mockRequestBody = { id: '1' };

      global.fetch = vi
        .fn()
        .mockResolvedValue(createMockResponse(mockResponseData));

      const result = await apiRequest('/api/todos', 'DELETE', mockRequestBody);

      expect(fetch).toHaveBeenCalledWith('/api/todos', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
        body: JSON.stringify(mockRequestBody),
      });

      expect(result).toEqual(mockResponseData);
    });

    it('bodyなしのリクエストが正常に実行される', async () => {
      const mockResponseData = { status: 'ok' };

      global.fetch = vi
        .fn()
        .mockResolvedValue(createMockResponse(mockResponseData));

      const result = await apiRequest('/api/status', 'POST');

      expect(fetch).toHaveBeenCalledWith('/api/status', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
        body: undefined,
      });

      expect(result).toEqual(mockResponseData);
    });

    it('空のbodyでリクエストが正常に実行される', async () => {
      const mockResponseData = { status: 'ok' };

      global.fetch = vi
        .fn()
        .mockResolvedValue(createMockResponse(mockResponseData));

      const result = await apiRequest('/api/status', 'POST', undefined);

      expect(fetch).toHaveBeenCalledWith('/api/status', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
        body: undefined,
      });

      expect(result).toEqual(mockResponseData);
    });
  });

  describe('エラーレスポンス', () => {
    it('HTTPエラーステータスでエラーがスローされる', async () => {
      const errorData = { error: 'Bad Request' };

      global.fetch = vi
        .fn()
        .mockResolvedValue(createMockResponse(errorData, false, 400));

      await expect(
        apiRequest('/api/todos', 'POST', { text: 'Test' }),
      ).rejects.toThrow('Bad Request');

      expect(console.error).toHaveBeenCalledWith(
        'API request error:',
        expect.any(Error),
      );
    });

    it('エラーレスポンスにerrorフィールドがない場合、デフォルトメッセージが使用される', async () => {
      const errorData = { message: 'Something went wrong' };

      global.fetch = vi
        .fn()
        .mockResolvedValue(createMockResponse(errorData, false, 500));

      await expect(
        apiRequest('/api/todos', 'POST', { text: 'Test' }),
      ).rejects.toThrow('API request failed');
    });

    it('ネットワークエラーでエラーがスローされる', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(
        apiRequest('/api/todos', 'POST', { text: 'Test' }),
      ).rejects.toThrow('Network error');

      expect(console.error).toHaveBeenCalledWith(
        'API request error:',
        expect.any(Error),
      );
    });

    it('JSONパースエラーでエラーがスローされる', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await expect(
        apiRequest('/api/todos', 'POST', { text: 'Test' }),
      ).rejects.toThrow('Invalid JSON');
    });
  });

  describe('TypeScript型の検証', () => {
    it('ジェネリック型が正しく推論される', async () => {
      interface TodoRequest {
        text: string;
        status: string;
      }

      interface TodoResponse {
        id: string;
        text: string;
        status: string;
        createdAt: string;
      }

      const mockResponseData: TodoResponse = {
        id: '1',
        text: 'Test todo',
        status: 'pending',
        createdAt: '2023-01-01T00:00:00Z',
      };

      global.fetch = vi
        .fn()
        .mockResolvedValue(createMockResponse(mockResponseData));

      const requestBody: TodoRequest = {
        text: 'Test todo',
        status: 'pending',
      };

      const result = await apiRequest<TodoRequest, TodoResponse>(
        '/api/todos',
        'POST',
        requestBody,
      );

      // TypeScriptの型推論により、resultはTodoResponse型になる
      expect(result.id).toBe('1');
      expect(result.text).toBe('Test todo');
      expect(result.status).toBe('pending');
      expect(result.createdAt).toBe('2023-01-01T00:00:00Z');
    });

    it('レスポンス型を指定しない場合、リクエスト型が使用される', async () => {
      interface TodoRequest {
        text: string;
        status: string;
      }

      const mockResponseData = {
        text: 'Test todo',
        status: 'pending',
      };

      global.fetch = vi
        .fn()
        .mockResolvedValue(createMockResponse(mockResponseData));

      const requestBody: TodoRequest = {
        text: 'Test todo',
        status: 'pending',
      };

      const result = await apiRequest<TodoRequest>(
        '/api/todos',
        'POST',
        requestBody,
      );

      // レスポンス型が指定されていないため、リクエスト型が使用される
      expect(result.text).toBe('Test todo');
      expect(result.status).toBe('pending');
    });
  });

  describe('リクエストヘッダー', () => {
    it('適切なContent-Typeヘッダーが設定される', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValue(createMockResponse({ success: true }));

      await apiRequest('/api/todos', 'POST', { text: 'Test' });

      expect(fetch).toHaveBeenCalledWith(
        '/api/todos',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );
    });

    it('credentialsがincludeに設定される', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValue(createMockResponse({ success: true }));

      await apiRequest('/api/todos', 'POST', { text: 'Test' });

      expect(fetch).toHaveBeenCalledWith(
        '/api/todos',
        expect.objectContaining({
          credentials: 'include',
        }),
      );
    });

    it('cacheがno-storeに設定される', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValue(createMockResponse({ success: true }));

      await apiRequest('/api/todos', 'POST', { text: 'Test' });

      expect(fetch).toHaveBeenCalledWith(
        '/api/todos',
        expect.objectContaining({
          cache: 'no-store',
        }),
      );
    });
  });

  describe('エッジケース', () => {
    it('空文字列のURLでもリクエストが実行される', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValue(createMockResponse({ success: true }));

      await apiRequest('', 'POST', { test: 'data' });

      expect(fetch).toHaveBeenCalledWith('', expect.any(Object));
    });

    it('特殊文字を含むURLでもリクエストが実行される', async () => {
      const specialUrl = '/api/todos?filter=test@#$%^&*()';

      global.fetch = vi
        .fn()
        .mockResolvedValue(createMockResponse({ success: true }));

      await apiRequest(specialUrl, 'POST', { test: 'data' });

      expect(fetch).toHaveBeenCalledWith(specialUrl, expect.any(Object));
    });

    it('複雑なオブジェクトのbodyでも正しくシリアライズされる', async () => {
      const complexBody = {
        nested: {
          array: [1, 2, 3],
          object: { key: 'value' },
        },
        date: '2023-01-01T00:00:00Z',
        boolean: true,
        null: null,
      };

      global.fetch = vi
        .fn()
        .mockResolvedValue(createMockResponse({ success: true }));

      await apiRequest('/api/complex', 'POST', complexBody);

      expect(fetch).toHaveBeenCalledWith(
        '/api/complex',
        expect.objectContaining({
          body: JSON.stringify(complexBody),
        }),
      );
    });

    it('fetchが未定義の場合でもエラーがキャッチされる', async () => {
      // fetchを一時的に削除
      const originalFetch = global.fetch;
      // @ts-expect-error - Testing fetch undefined scenario
      delete global.fetch;

      await expect(
        apiRequest('/api/todos', 'POST', { text: 'Test' }),
      ).rejects.toThrow();

      // fetchを復元
      global.fetch = originalFetch;
    });

    it('レスポンスのJSONパースが成功する', async () => {
      const responseData = { complex: { data: [{ id: 1, name: 'test' }] } };

      global.fetch = vi
        .fn()
        .mockResolvedValue(createMockResponse(responseData));

      const result = await apiRequest('/api/complex', 'POST', {});

      expect(result).toEqual(responseData);
    });

    it('nullやundefinedのbodyでも適切に処理される', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValue(createMockResponse({ success: true }));

      await apiRequest('/api/test', 'POST', null);

      expect(fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          body: undefined,
        }),
      );
    });
  });
});
