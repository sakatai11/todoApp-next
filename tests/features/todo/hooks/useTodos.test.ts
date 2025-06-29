import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTodos } from '@/features/todo/hooks/useTodos';
import { TodoListProps } from '@/types/todos';
import { mockTodos } from '@/tests/test-utils';

// Mock apiRequest
vi.mock('@/features/libs/apis', () => ({
  apiRequest: vi.fn(),
}));

// Get the mocked function
import { apiRequest } from '@/features/libs/apis';
const mockApiRequest = vi.mocked(apiRequest);

// サブモジュールのモックデータを使用（最初の2つを使用）
const mockInitialTodos: TodoListProps[] = mockTodos.slice(0, 2);

describe('useTodos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('初期化', () => {
    it('初期todosで正しく初期化される', () => {
      const { result } = renderHook(() => useTodos(mockInitialTodos));

      expect(result.current.todos).toEqual(mockInitialTodos);
      expect(result.current.input).toEqual({ text: '', status: '' });
      expect(result.current.editId).toBe(null);
      expect(result.current.error).toEqual({
        listPushArea: false,
        listModalArea: false,
      });
      expect(result.current.addTodoOpenStatus).toBe(null);
    });

    it('空の配列で初期化される', () => {
      const { result } = renderHook(() => useTodos([]));
      expect(result.current.todos).toEqual([]);
    });
  });

  describe('状態更新', () => {
    it('inputが正しく更新される', () => {
      const { result } = renderHook(() => useTodos(mockInitialTodos));

      act(() => {
        result.current.setInput({ text: 'New Todo', status: 'pending' });
      });

      expect(result.current.input.text).toBe('New Todo');
      expect(result.current.input.status).toBe('pending');
    });

    it('editIdが正しく更新される', () => {
      const { result } = renderHook(() => useTodos(mockInitialTodos));

      act(() => {
        result.current.setEditId('todo-1');
      });

      expect(result.current.editId).toBe('todo-1');
    });

    it('addTodoOpenStatusが正しく更新される', () => {
      const { result } = renderHook(() => useTodos(mockInitialTodos));

      act(() => {
        result.current.setAddTodoOpenStatus('pending');
      });

      expect(result.current.addTodoOpenStatus).toBe('pending');
    });
  });

  describe('Todo追加 (addTodo)', () => {
    it('正常にTodoが追加される', async () => {
      const newTodo = {
        id: 'new-todo-id',
        text: 'New Todo',
        status: 'pending',
        bool: false,
        createdTime: Date.now(),
        updateTime: Date.now(),
      };

      mockApiRequest.mockResolvedValueOnce(newTodo);

      const { result } = renderHook(() => useTodos(mockInitialTodos));

      act(() => {
        result.current.setInput({ text: 'New Todo', status: 'pending' });
      });

      let addResult;
      await act(async () => {
        addResult = await result.current.addTodo();
      });

      expect(addResult).toBe(true);
      expect(mockApiRequest).toHaveBeenCalledWith(
        '/api/todos',
        'POST',
        expect.objectContaining({
          text: 'New Todo',
          status: 'pending',
          bool: false,
        }),
      );
      expect(result.current.todos).toHaveLength(3);
      expect(result.current.input).toEqual({ text: '', status: '' });
      expect(result.current.error.listPushArea).toBe(false);
    });

    it('入力が空の場合はエラーになる', async () => {
      const { result } = renderHook(() => useTodos(mockInitialTodos));

      let addResult;
      await act(async () => {
        addResult = await result.current.addTodo();
      });

      expect(addResult).toBe(false);
      expect(result.current.error.listPushArea).toBe(true);
      expect(mockApiRequest).not.toHaveBeenCalled();
    });

    it('API呼び出しが失敗した場合はエラーになる', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockApiRequest.mockRejectedValueOnce(new Error('API Error'));

      const { result } = renderHook(() => useTodos(mockInitialTodos));

      act(() => {
        result.current.setInput({ text: 'New Todo', status: 'pending' });
      });

      let addResult;
      await act(async () => {
        addResult = await result.current.addTodo();
      });

      expect(addResult).toBe(false);
      expect(result.current.error.listPushArea).toBe(true);

      consoleSpy.mockRestore();
    });
  });

  describe('Todo削除 (deleteTodo)', () => {
    it('正常にTodoが削除される', async () => {
      mockApiRequest.mockResolvedValueOnce({});

      const { result } = renderHook(() => useTodos(mockInitialTodos));

      await act(async () => {
        await result.current.deleteTodo('todo-1');
      });

      expect(mockApiRequest).toHaveBeenCalledWith('/api/todos', 'DELETE', {
        id: 'todo-1',
      });
      expect(result.current.todos).toHaveLength(1);
      expect(
        result.current.todos.find((todo) => todo.id === 'todo-1'),
      ).toBeUndefined();
    });

    it('存在しないTodoの削除でもエラーにならない', async () => {
      mockApiRequest.mockResolvedValueOnce({});

      const { result } = renderHook(() => useTodos(mockInitialTodos));

      await act(async () => {
        await result.current.deleteTodo('non-existent-id');
      });

      expect(result.current.todos).toHaveLength(2);
    });

    it('API呼び出しが失敗した場合でもクライアント側の削除は実行される', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockApiRequest.mockRejectedValueOnce(new Error('API Error'));

      const { result } = renderHook(() => useTodos(mockInitialTodos));

      await act(async () => {
        await result.current.deleteTodo('todo-1');
      });

      // クライアント側では削除が実行される（楽観的更新）
      expect(result.current.todos).toHaveLength(1);
      expect(
        result.current.todos.find((todo) => todo.id === 'todo-1'),
      ).toBeUndefined();

      consoleSpy.mockRestore();
    });
  });

  describe('Todo編集 (editTodo)', () => {
    it('正常に編集モードに入る', () => {
      const { result } = renderHook(() => useTodos(mockInitialTodos));

      act(() => {
        result.current.editTodo('todo-1');
      });

      expect(result.current.editId).toBe('todo-1');
      const firstTodo = mockInitialTodos.find((todo) => todo.id === 'todo-1');
      expect(result.current.input.text).toBe(firstTodo?.text);
      expect(result.current.input.status).toBe(firstTodo?.status);
    });

    it('存在しないTodoの編集では何も変更されない', () => {
      const { result } = renderHook(() => useTodos(mockInitialTodos));

      act(() => {
        result.current.editTodo('non-existent-id');
      });

      expect(result.current.editId).toBe(null);
      expect(result.current.input).toEqual({ text: '', status: '' });
    });
  });

  describe('Todo完了状態の切り替え (toggleSelected)', () => {
    it('正常にbool値が切り替わる', async () => {
      mockApiRequest.mockResolvedValueOnce({});

      const { result } = renderHook(() => useTodos(mockInitialTodos));

      await act(async () => {
        await result.current.toggleSelected('todo-1');
      });

      const originalTodo = mockInitialTodos.find(
        (todo) => todo.id === 'todo-1',
      );
      const expectedBool = !originalTodo?.bool;

      expect(mockApiRequest).toHaveBeenCalledWith('/api/todos', 'PUT', {
        id: 'todo-1',
        bool: expectedBool,
      });

      const updatedTodo = result.current.todos.find(
        (todo) => todo.id === 'todo-1',
      );
      expect(updatedTodo?.bool).toBe(expectedBool);
    });

    it('存在しないTodoの切り替えでは何も変更されない', async () => {
      const { result } = renderHook(() => useTodos(mockInitialTodos));

      await act(async () => {
        await result.current.toggleSelected('non-existent-id');
      });

      expect(mockApiRequest).not.toHaveBeenCalled();
    });

    it('API呼び出しが失敗した場合でもクライアント側の更新は実行される', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockApiRequest.mockRejectedValueOnce(new Error('API Error'));

      const { result } = renderHook(() => useTodos(mockInitialTodos));

      const originalTodo = mockInitialTodos.find(
        (todo) => todo.id === 'todo-1',
      );
      const expectedBool = !originalTodo?.bool;

      await act(async () => {
        await result.current.toggleSelected('todo-1');
      });

      const updatedTodo = result.current.todos.find(
        (todo) => todo.id === 'todo-1',
      );
      expect(updatedTodo?.bool).toBe(expectedBool);

      consoleSpy.mockRestore();
    });
  });

  describe('Todo保存 (saveTodo)', () => {
    it('正常にTodoが保存される', async () => {
      mockApiRequest.mockResolvedValueOnce({});

      const { result } = renderHook(() => useTodos(mockInitialTodos));

      act(() => {
        result.current.editTodo('todo-1');
        result.current.setInput({
          text: 'Updated Todo',
          status: 'in_progress',
        });
      });

      await act(async () => {
        await result.current.saveTodo();
      });

      expect(mockApiRequest).toHaveBeenCalledWith('/api/todos', 'PUT', {
        id: 'todo-1',
        text: 'Updated Todo',
        status: 'in_progress',
        updateTime: expect.any(String),
      });

      const updatedTodo = result.current.todos.find(
        (todo) => todo.id === 'todo-1',
      );
      expect(updatedTodo?.text).toBe('Updated Todo');
      expect(updatedTodo?.status).toBe('in_progress');
      expect(result.current.editId).toBe(null);
      expect(result.current.input).toEqual({ text: '', status: '' });
    });

    it('変更がない場合は保存されない', async () => {
      const { result } = renderHook(() => useTodos(mockInitialTodos));

      act(() => {
        result.current.editTodo('todo-1');
      });

      await act(async () => {
        await result.current.saveTodo();
      });

      expect(mockApiRequest).not.toHaveBeenCalled();
      expect(result.current.editId).toBe(null);
      expect(result.current.input).toEqual({ text: '', status: '' });
    });

    it('入力が空の場合はエラーになる', async () => {
      const { result } = renderHook(() => useTodos(mockInitialTodos));

      act(() => {
        result.current.setEditId('todo-1');
        result.current.setInput({ text: '', status: '' });
      });

      await act(async () => {
        await result.current.saveTodo();
      });

      expect(mockApiRequest).not.toHaveBeenCalled();
      expect(result.current.error.listModalArea).toBe(true);
    });

    it('API呼び出しが失敗した場合はエラー状態になる', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockApiRequest.mockRejectedValueOnce(new Error('API Error'));

      const { result } = renderHook(() => useTodos(mockInitialTodos));

      act(() => {
        result.current.editTodo('todo-1');
        result.current.setInput({
          text: 'Updated Todo',
          status: 'in_progress',
        });
      });

      await act(async () => {
        await result.current.saveTodo();
      });

      expect(mockApiRequest).toHaveBeenCalledWith('/api/todos', 'PUT', {
        id: 'todo-1',
        text: 'Updated Todo',
        status: 'in_progress',
        updateTime: expect.any(String),
      });

      expect(result.current.error.listModalArea).toBe(true);

      const updatedTodo = result.current.todos.find(
        (todo) => todo.id === 'todo-1',
      );
      expect(updatedTodo?.text).toBe('Updated Todo');
      expect(updatedTodo?.status).toBe('in_progress');

      consoleSpy.mockRestore();
    });
  });

  describe('タイムスタンプソート処理エッジケース', () => {
    it('number型createdTimeでソートが動作する（addTodo/saveTodo共通）', async () => {
      // number型のcreatedTimeを持つ複数のTodoデータを作成
      const todosWithNumberTime = [
        {
          id: 'number-time-todo-1',
          text: 'Number Time Todo 1',
          status: 'todo',
          bool: false,
          createdTime: 2222222222, // number型（新しい）
          updateTime: 2222222222,
        } as unknown as TodoListProps,
        {
          id: 'number-time-todo-2',
          text: 'Number Time Todo 2',
          status: 'todo',
          bool: false,
          createdTime: 1111111111, // number型（古い）
          updateTime: 1111111111,
        } as unknown as TodoListProps,
      ];

      const { result } = renderHook(() => useTodos(todosWithNumberTime));

      // saveTodo内でnumber型分岐をテスト
      act(() => {
        result.current.editTodo('number-time-todo-2');
        result.current.setInput({
          text: 'Updated Number Todo',
          status: 'done',
        });
      });

      mockApiRequest.mockResolvedValueOnce({ success: true });

      await act(async () => {
        await result.current.saveTodo();
      });

      const updatedTodo = result.current.todos.find(
        (todo) => todo.id === 'number-time-todo-2',
      );
      expect(updatedTodo?.text).toBe('Updated Number Todo');
      expect(updatedTodo?.status).toBe('done');

      // ソート順序確認（新しい方が先頭）
      expect(result.current.todos[0].id).toBe('number-time-todo-1');
      expect(result.current.todos[1].id).toBe('number-time-todo-2');
    });

    it('toMillisメソッドを持つオブジェクトでソートが動作する', async () => {
      const todosWithToMillisTime = [
        {
          id: 'tomillis-time-todo',
          text: 'ToMillis Time Todo',
          status: 'todo',
          bool: false,
          createdTime: { toMillis: () => 5555555555 }, // toMillisメソッドを持つオブジェクト
          updateTime: { toMillis: () => 5555555555 },
        } as unknown as TodoListProps,
      ];

      const { result } = renderHook(() => useTodos(todosWithToMillisTime));

      act(() => {
        result.current.editTodo('tomillis-time-todo');
        result.current.setInput({
          text: 'Updated ToMillis Todo',
          status: 'done',
        });
      });

      mockApiRequest.mockResolvedValueOnce({ success: true });

      await act(async () => {
        await result.current.saveTodo();
      });

      const updatedTodo = result.current.todos.find(
        (todo) => todo.id === 'tomillis-time-todo',
      );
      expect(updatedTodo?.text).toBe('Updated ToMillis Todo');
      expect(updatedTodo?.status).toBe('done');
    });

    it('toMillisプロパティがfunctionでない場合フォールバックする', async () => {
      const todosWithNonFunctionToMillis = [
        {
          id: 'non-function-tomillis-todo',
          text: 'Non Function ToMillis Todo',
          status: 'todo',
          bool: false,
          createdTime: { toMillis: 'not-a-function' }, // toMillisがfunctionでない
          updateTime: { toMillis: 'not-a-function' },
        } as unknown as TodoListProps,
      ];

      const { result } = renderHook(() =>
        useTodos(todosWithNonFunctionToMillis),
      );

      act(() => {
        result.current.editTodo('non-function-tomillis-todo');
        result.current.setInput({
          text: 'Updated Non Function Todo',
          status: 'done',
        });
      });

      mockApiRequest.mockResolvedValueOnce({ success: true });

      await act(async () => {
        await result.current.saveTodo();
      });

      const updatedTodo = result.current.todos.find(
        (todo) => todo.id === 'non-function-tomillis-todo',
      );
      expect(updatedTodo?.text).toBe('Updated Non Function Todo');
      expect(updatedTodo?.status).toBe('done');
    });

    it('falsyなtimestamp値でも動作する', async () => {
      const todosWithFalsyTime = [
        {
          id: 'falsy-time-todo',
          text: 'Falsy Time Todo',
          status: 'todo',
          bool: false,
          createdTime: 0, // falsyな値
          updateTime: 0,
        } as unknown as TodoListProps,
      ];

      const { result } = renderHook(() => useTodos(todosWithFalsyTime));

      act(() => {
        result.current.editTodo('falsy-time-todo');
        result.current.setInput({
          text: 'Updated Falsy Todo',
          status: 'done',
        });
      });

      mockApiRequest.mockResolvedValueOnce({ success: true });

      await act(async () => {
        await result.current.saveTodo();
      });

      const updatedTodo = result.current.todos.find(
        (todo) => todo.id === 'falsy-time-todo',
      );
      expect(updatedTodo?.text).toBe('Updated Falsy Todo');
      expect(updatedTodo?.status).toBe('done');
    });

    it('parseIntがNaNの場合に0にフォールバックする', async () => {
      const todosWithNaNTime = [
        {
          id: 'nan-time-todo',
          text: 'NaN Time Todo',
          status: 'todo',
          bool: false,
          createdTime: 'not-a-valid-number', // parseIntでNaNになる文字列
          updateTime: 'not-a-valid-number',
        } as unknown as TodoListProps,
      ];

      const { result } = renderHook(() => useTodos(todosWithNaNTime));

      act(() => {
        result.current.editTodo('nan-time-todo');
        result.current.setInput({
          text: 'Updated NaN Todo',
          status: 'done',
        });
      });

      mockApiRequest.mockResolvedValueOnce({ success: true });

      await act(async () => {
        await result.current.saveTodo();
      });

      const updatedTodo = result.current.todos.find(
        (todo) => todo.id === 'nan-time-todo',
      );
      expect(updatedTodo?.text).toBe('Updated NaN Todo');
      expect(updatedTodo?.status).toBe('done');
    });

    it('saveTodo内でtoMillisプロパティがない場合にparseIntフォールバックする', async () => {
      const todosWithMixedTimestamps = [
        {
          id: 'saveTodo-no-tomillis',
          text: 'SaveTodo No ToMillis',
          status: 'todo',
          bool: false,
          createdTime: 'string-timestamp-123', // toMillisプロパティがない文字列
          updateTime: 'string-timestamp-456',
        } as unknown as TodoListProps,
        {
          id: 'normal-todo',
          text: 'Normal Todo',
          status: 'todo',
          bool: false,
          createdTime: 1234567890, // number型
          updateTime: 1234567890,
        } as unknown as TodoListProps,
      ];

      const { result } = renderHook(() => useTodos(todosWithMixedTimestamps));

      act(() => {
        result.current.editTodo('saveTodo-no-tomillis');
        result.current.setInput({
          text: 'Updated SaveTodo No ToMillis',
          status: 'done',
        });
      });

      mockApiRequest.mockResolvedValueOnce({ success: true });

      await act(async () => {
        await result.current.saveTodo();
      });

      const updatedTodo = result.current.todos.find(
        (todo) => todo.id === 'saveTodo-no-tomillis',
      );
      expect(updatedTodo?.text).toBe('Updated SaveTodo No ToMillis');
      expect(updatedTodo?.status).toBe('done');
    });

    it('異常なcreatedTime値でもソートが動作する（addTodo）', async () => {
      const abnormalTodo = {
        id: 'abnormal-todo',
        text: 'Abnormal Todo',
        status: 'todo',
        bool: false,
        createdTime: 'invalid-timestamp', // 文字列の異常値
        updateTime: 'invalid-timestamp',
      };

      mockApiRequest.mockResolvedValueOnce(abnormalTodo);

      const { result } = renderHook(() => useTodos(mockTodos));

      act(() => {
        result.current.setInput({
          text: 'Abnormal Todo',
          status: 'todo',
        });
      });

      await act(async () => {
        await result.current.addTodo();
      });

      expect(result.current.todos).toHaveLength(mockTodos.length + 1);
      const addedTodo = result.current.todos.find(
        (todo) => todo.id === 'abnormal-todo',
      );
      expect(addedTodo).toBeDefined();
      expect(addedTodo?.text).toBe('Abnormal Todo');
    });

    it('null値のタイムスタンプでも動作する（addTodo）', async () => {
      const nullTimestampTodo = {
        id: 'null-todo',
        text: 'Null Timestamp Todo',
        status: 'todo',
        bool: false,
        createdTime: null,
        updateTime: null,
      };

      mockApiRequest.mockResolvedValueOnce(nullTimestampTodo);

      const { result } = renderHook(() => useTodos(mockTodos));

      act(() => {
        result.current.setInput({
          text: 'Null Timestamp Todo',
          status: 'todo',
        });
      });

      await act(async () => {
        await result.current.addTodo();
      });

      expect(result.current.todos).toHaveLength(mockTodos.length + 1);
      const addedTodo = result.current.todos.find(
        (todo) => todo.id === 'null-todo',
      );
      expect(addedTodo).toBeDefined();
      expect(addedTodo?.text).toBe('Null Timestamp Todo');
    });
  });
});
