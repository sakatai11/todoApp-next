import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDeleteList } from '@/features/todo/hooks/useDeleteList';
import { TodoListProps } from '@/types/todos';
import { StatusListProps } from '@/types/lists';
import { mockTodos, mockLists } from '@/tests/test-utils';
import { Timestamp } from 'firebase-admin/firestore';

// Mock apiRequest
vi.mock('@/features/libs/apis', () => ({
  apiRequest: vi.fn(),
}));

// Get the mocked function
import { apiRequest } from '@/features/libs/apis';
const mockApiRequest = vi.mocked(apiRequest);

// サブモジュールのモックデータを使用
const mockInitialTodos: TodoListProps[] = mockTodos;
const mockInitialLists: StatusListProps[] = mockLists;

describe('useDeleteList', () => {
  let mockSetTodos: ReturnType<typeof vi.fn>;
  let mockSetLists: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSetTodos = vi.fn();
    mockSetLists = vi.fn();
  });

  describe('初期化', () => {
    it('deleteList関数が正しく返される', () => {
      const { result } = renderHook(() =>
        useDeleteList({
          todos: mockInitialTodos,
          setTodos: mockSetTodos,
          setLists: mockSetLists,
        }),
      );

      expect(result.current.deleteList).toBeDefined();
      expect(typeof result.current.deleteList).toBe('function');
    });
  });

  describe('リスト削除 (deleteList)', () => {
    it('正常にリストが削除される', async () => {
      mockApiRequest.mockResolvedValue({});

      const { result } = renderHook(() =>
        useDeleteList({
          todos: mockInitialTodos,
          setTodos: mockSetTodos,
          setLists: mockSetLists,
        }),
      );

      await act(async () => {
        await result.current.deleteList('list-1', 'in-progress');
      });

      // リスト削除のAPI呼び出しを確認
      expect(mockApiRequest).toHaveBeenCalledWith('/api/lists', 'DELETE', {
        id: 'list-1',
      });

      // setListsが呼び出されることを確認
      expect(mockSetLists).toHaveBeenCalledWith(expect.any(Function));
    });

    it('削除後にリストの番号が正しく再計算される', async () => {
      mockApiRequest.mockResolvedValue({});

      const { result } = renderHook(() =>
        useDeleteList({
          todos: mockInitialTodos,
          setTodos: mockSetTodos,
          setLists: mockSetLists,
        }),
      );

      await act(async () => {
        await result.current.deleteList('list-2', 'done');
      });

      // setListsが呼び出され、更新関数が正常に動作することを確認
      expect(mockSetLists).toHaveBeenCalledWith(expect.any(Function));

      // 更新関数の動作を確認するため、実際に関数を呼び出す
      const updateFunction = mockSetLists.mock.calls[0][0];
      const updatedLists = updateFunction(mockInitialLists);

      // list-2が削除され、番号が再計算されることを確認
      expect(updatedLists).toHaveLength(2);
      expect(
        updatedLists.find((list: StatusListProps) => list.id === 'list-2'),
      ).toBeUndefined();
      expect(updatedLists[0].number).toBe(1);
      expect(updatedLists[1].number).toBe(2);
    });

    it('関連するTodoが存在する場合、それらも削除される', async () => {
      mockApiRequest.mockResolvedValue({});

      const { result } = renderHook(() =>
        useDeleteList({
          todos: mockInitialTodos,
          setTodos: mockSetTodos,
          setLists: mockSetLists,
        }),
      );

      await act(async () => {
        await result.current.deleteList('list-1', 'in-progress');
      });

      // 'in-progress'ステータスのTodoを確認
      const inProgressTodos = mockInitialTodos.filter(
        (todo) => todo.status === 'in-progress',
      );

      // 関連するTodoがある場合、それらの削除API呼び出しを確認
      if (inProgressTodos.length > 0) {
        // Promise.allで並列削除が行われることを確認
        expect(mockApiRequest).toHaveBeenCalledTimes(
          1 + inProgressTodos.length,
        );

        // 各Todoの削除API呼び出しを確認
        inProgressTodos.forEach((todo) => {
          expect(mockApiRequest).toHaveBeenCalledWith('/api/todos', 'DELETE', {
            id: todo.id,
          });
        });

        // setTodosが呼び出されることを確認
        expect(mockSetTodos).toHaveBeenCalledWith(expect.any(Function));
      }
    });

    it('67行目のsetTodos処理をテスト（指定ステータスのtodo削除）', async () => {
      mockApiRequest.mockResolvedValue({});

      const { result } = renderHook(() =>
        useDeleteList({
          todos: mockInitialTodos,
          setTodos: mockSetTodos,
          setLists: mockSetLists,
        }),
      );

      await act(async () => {
        await result.current.deleteList('list-1', 'in-progress');
      });

      // setTodosが呼び出されることを確認
      expect(mockSetTodos).toHaveBeenCalledWith(expect.any(Function));

      // 67行目の実際の動作を確認 - setTodosの更新関数をテスト
      const updateTodosFunction = mockSetTodos.mock.calls[0][0];
      const updatedTodos = updateTodosFunction(mockInitialTodos);

      // 'in-progress'ステータスのTodoが削除されることを確認
      const remainingTodos = updatedTodos.filter(
        (todo: TodoListProps) => todo.status === 'in-progress',
      );
      expect(remainingTodos).toHaveLength(0);

      // 他のステータスのTodoは残ることを確認
      const otherStatusTodos = updatedTodos.filter(
        (todo: TodoListProps) => todo.status !== 'in-progress',
      );
      const originalOtherStatusTodos = mockInitialTodos.filter(
        (todo: TodoListProps) => todo.status !== 'in-progress',
      );
      expect(otherStatusTodos).toHaveLength(originalOtherStatusTodos.length);
    });

    it('関連するTodoが存在しない場合、Todo削除は行われない', async () => {
      mockApiRequest.mockResolvedValue({});

      // 関連するTodoがないステータスを持つリストを作成
      const todosWithoutStatus = mockInitialTodos.filter(
        (todo) => todo.status !== 'non-existent-status',
      );

      const { result } = renderHook(() =>
        useDeleteList({
          todos: todosWithoutStatus,
          setTodos: mockSetTodos,
          setLists: mockSetLists,
        }),
      );

      await act(async () => {
        await result.current.deleteList('list-1', 'non-existent-status');
      });

      // リスト削除のAPI呼び出しのみが行われることを確認
      expect(mockApiRequest).toHaveBeenCalledTimes(1);
      expect(mockApiRequest).toHaveBeenCalledWith('/api/lists', 'DELETE', {
        id: 'list-1',
      });

      // setTodosは呼び出されないことを確認
      expect(mockSetTodos).not.toHaveBeenCalled();
    });

    it('API呼び出しが失敗した場合、エラーがログに出力される', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockApiRequest.mockRejectedValueOnce(new Error('API Error'));

      const { result } = renderHook(() =>
        useDeleteList({
          todos: mockInitialTodos,
          setTodos: mockSetTodos,
          setLists: mockSetLists,
        }),
      );

      await act(async () => {
        await result.current.deleteList('list-1', 'in-progress');
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to delete list and related todos:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });

    it('Todo削除のAPI呼び出しが部分的に失敗しても処理が継続される', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // リスト削除は成功、Todo削除は失敗
      mockApiRequest
        .mockResolvedValueOnce({}) // リスト削除成功
        .mockRejectedValueOnce(new Error('Todo Delete Error')); // Todo削除失敗

      const { result } = renderHook(() =>
        useDeleteList({
          todos: mockInitialTodos,
          setTodos: mockSetTodos,
          setLists: mockSetLists,
        }),
      );

      await act(async () => {
        await result.current.deleteList('list-1', 'in-progress');
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to delete list and related todos:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('依存配列の変更', () => {
    it('todos配列が変更された場合、フックが再実行される', () => {
      const { result, rerender } = renderHook(
        ({ todos }) =>
          useDeleteList({
            todos,
            setTodos: mockSetTodos,
            setLists: mockSetLists,
          }),
        {
          initialProps: { todos: mockInitialTodos },
        },
      );

      const initialDeleteList = result.current.deleteList;

      // 新しいtodos配列で再レンダリング
      const newTodos: TodoListProps[] = [
        ...mockInitialTodos,
        {
          id: 'new-todo',
          text: 'New Todo',
          status: 'todo',
          bool: false,
          createdTime: Timestamp.fromMillis(Date.now()),
          updateTime: Timestamp.fromMillis(Date.now()),
        },
      ];

      rerender({ todos: newTodos });

      // deleteList関数が新しく生成されることを確認
      expect(result.current.deleteList).not.toBe(initialDeleteList);
    });

    it('setTodos関数が変更された場合、フックが再実行される', () => {
      const { result, rerender } = renderHook(
        ({ setTodos }) =>
          useDeleteList({
            todos: mockInitialTodos,
            setTodos,
            setLists: mockSetLists,
          }),
        {
          initialProps: { setTodos: mockSetTodos },
        },
      );

      const initialDeleteList = result.current.deleteList;

      // 新しいsetTodos関数で再レンダリング
      const newSetTodos = vi.fn();
      rerender({ setTodos: newSetTodos });

      // deleteList関数が新しく生成されることを確認
      expect(result.current.deleteList).not.toBe(initialDeleteList);
    });

    it('setLists関数が変更された場合、フックが再実行される', () => {
      const { result, rerender } = renderHook(
        ({ setLists }) =>
          useDeleteList({
            todos: mockInitialTodos,
            setTodos: mockSetTodos,
            setLists,
          }),
        {
          initialProps: { setLists: mockSetLists },
        },
      );

      const initialDeleteList = result.current.deleteList;

      // 新しいsetLists関数で再レンダリング
      const newSetLists = vi.fn();
      rerender({ setLists: newSetLists });

      // deleteList関数が新しく生成されることを確認
      expect(result.current.deleteList).not.toBe(initialDeleteList);
    });
  });

  describe('エッジケース', () => {
    it('空のTodo配列でも正常に動作する', async () => {
      mockApiRequest.mockResolvedValue({});

      const { result } = renderHook(() =>
        useDeleteList({
          todos: [],
          setTodos: mockSetTodos,
          setLists: mockSetLists,
        }),
      );

      await act(async () => {
        await result.current.deleteList('list-1', 'in-progress');
      });

      // リスト削除のAPI呼び出しのみが行われることを確認
      expect(mockApiRequest).toHaveBeenCalledTimes(1);
      expect(mockApiRequest).toHaveBeenCalledWith('/api/lists', 'DELETE', {
        id: 'list-1',
      });

      // setTodosは呼び出されないことを確認
      expect(mockSetTodos).not.toHaveBeenCalled();
    });

    it('存在しないリストIDでも処理が実行される', async () => {
      mockApiRequest.mockResolvedValue({});

      const { result } = renderHook(() =>
        useDeleteList({
          todos: mockInitialTodos,
          setTodos: mockSetTodos,
          setLists: mockSetLists,
        }),
      );

      await act(async () => {
        await result.current.deleteList('non-existent-list', 'in-progress');
      });

      // API呼び出しは実行される
      expect(mockApiRequest).toHaveBeenCalledWith('/api/lists', 'DELETE', {
        id: 'non-existent-list',
      });

      // setListsは呼び出される
      expect(mockSetLists).toHaveBeenCalledWith(expect.any(Function));
    });

    it('空の文字列IDでも処理が実行される', async () => {
      mockApiRequest.mockResolvedValue({});

      const { result } = renderHook(() =>
        useDeleteList({
          todos: mockInitialTodos,
          setTodos: mockSetTodos,
          setLists: mockSetLists,
        }),
      );

      await act(async () => {
        await result.current.deleteList('', 'in-progress');
      });

      // API呼び出しは実行される
      expect(mockApiRequest).toHaveBeenCalledWith('/api/lists', 'DELETE', {
        id: '',
      });
    });
  });
});
