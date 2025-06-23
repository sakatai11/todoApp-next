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
      // コンソールエラーを抑制
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
  });

  describe('Todo編集 (editTodo)', () => {
    it('正常に編集モードに入る', () => {
      const { result } = renderHook(() => useTodos(mockInitialTodos));

      act(() => {
        result.current.editTodo('todo-1');
      });

      expect(result.current.editId).toBe('todo-1');
      expect(result.current.input.text).toBe('Next.js App Routerの学習');
      expect(result.current.input.status).toBe('in-progress');
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

      expect(mockApiRequest).toHaveBeenCalledWith('/api/todos', 'PUT', {
        id: 'todo-1',
        bool: false, // true から false に変更（サブモジュールデータではbool: trueが初期値）
      });

      const updatedTodo = result.current.todos.find(
        (todo) => todo.id === 'todo-1',
      );
      expect(updatedTodo?.bool).toBe(false);
    });

    it('存在しないTodoの切り替えでは何も変更されない', async () => {
      const { result } = renderHook(() => useTodos(mockInitialTodos));

      await act(async () => {
        await result.current.toggleSelected('non-existent-id');
      });

      expect(mockApiRequest).not.toHaveBeenCalled();
    });
  });

  describe('Todo保存 (saveTodo)', () => {
    it('正常にTodoが保存される', async () => {
      mockApiRequest.mockResolvedValueOnce({});

      const { result } = renderHook(() => useTodos(mockInitialTodos));

      // まず編集モードに入る
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
        updateTime: expect.any(Number),
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

      // 編集モードに入るが、内容は変更しない
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

      // 編集モードに入り、入力を空にする
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
  });
});
