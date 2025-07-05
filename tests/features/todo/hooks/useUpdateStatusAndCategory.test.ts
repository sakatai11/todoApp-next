import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUpdateStatusAndCategory } from '@/features/todo/hooks/useUpdateStatusAndCategory';
import { TodoListProps } from '@/types/todos';
import { StatusListProps } from '@/types/lists';
import { mockTodos, mockLists } from '@/tests/test-utils';

// Mock apiRequest
vi.mock('@/features/libs/apis', () => ({
  apiRequest: vi.fn(),
}));

// Mock updateStatusUtils
vi.mock('@/features/utils/updateStatusUtils', () => ({
  isDuplicateCategory: vi.fn(),
  updateListsAndTodos: vi.fn(),
}));

// Mock alert
vi.stubGlobal('alert', vi.fn());

// Get the mocked functions
import { apiRequest } from '@/features/libs/apis';
import {
  isDuplicateCategory,
  updateListsAndTodos,
} from '@/features/utils/updateStatusUtils';
const mockApiRequest = vi.mocked(apiRequest);
const mockIsDuplicateCategory = vi.mocked(isDuplicateCategory);
const mockUpdateListsAndTodos = vi.mocked(updateListsAndTodos);
const mockAlert = vi.mocked(alert);

// サブモジュールのモックデータを使用
const mockInitialTodos: TodoListProps[] = mockTodos;
const mockInitialLists: StatusListProps[] = mockLists;

describe('useUpdateStatusAndCategory', () => {
  let mockSetTodos: ReturnType<typeof vi.fn>;
  let mockSetLists: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSetTodos = vi.fn();
    mockSetLists = vi.fn();
  });

  describe('初期化', () => {
    it('初期状態で正しく初期化される', () => {
      const { result } = renderHook(() =>
        useUpdateStatusAndCategory({
          todos: mockInitialTodos,
          lists: mockInitialLists,
          setTodos: mockSetTodos,
          setLists: mockSetLists,
        }),
      );

      expect(result.current.editId).toBe(null);
      expect(result.current.editList).toBeDefined();
      expect(result.current.setEditId).toBeDefined();
      expect(typeof result.current.editList).toBe('function');
      expect(typeof result.current.setEditId).toBe('function');
    });
  });

  describe('状態更新', () => {
    it('editIdが正しく更新される', () => {
      const { result } = renderHook(() =>
        useUpdateStatusAndCategory({
          todos: mockInitialTodos,
          lists: mockInitialLists,
          setTodos: mockSetTodos,
          setLists: mockSetLists,
        }),
      );

      act(() => {
        result.current.setEditId('list-1');
      });

      expect(result.current.editId).toBe('list-1');
    });

    it('editIdがnullにリセットされる', () => {
      const { result } = renderHook(() =>
        useUpdateStatusAndCategory({
          todos: mockInitialTodos,
          lists: mockInitialLists,
          setTodos: mockSetTodos,
          setLists: mockSetLists,
        }),
      );

      act(() => {
        result.current.setEditId('list-1');
      });

      expect(result.current.editId).toBe('list-1');

      act(() => {
        result.current.setEditId(null);
      });

      expect(result.current.editId).toBe(null);
    });
  });

  describe('リスト編集 (editList)', () => {
    it('正常にリストが編集される', async () => {
      mockIsDuplicateCategory.mockReturnValue(false);
      mockApiRequest.mockResolvedValue({});

      const { result } = renderHook(() =>
        useUpdateStatusAndCategory({
          todos: mockInitialTodos,
          lists: mockInitialLists,
          setTodos: mockSetTodos,
          setLists: mockSetLists,
        }),
      );

      let editResult;
      await act(async () => {
        editResult = await result.current.editList(
          'list-1',
          'updated-category',
          'in-progress',
          'in-progress',
        );
      });

      expect(editResult).toBe(true);
      expect(mockIsDuplicateCategory).toHaveBeenCalledWith(
        mockInitialLists,
        'updated-category',
        'list-1',
      );

      // categoryの更新API呼び出しを確認
      expect(mockApiRequest).toHaveBeenCalledWith('/api/lists', 'PUT', {
        type: 'update',
        id: 'list-1',
        data: { category: 'updated-category' },
      });

      // statusの更新API呼び出しを確認
      expect(mockApiRequest).toHaveBeenCalledWith('/api/todos', 'PUT', {
        type: 'restatus',
        data: { oldStatus: 'in-progress', status: 'updated-category' },
      });

      // クライアント側の更新処理を確認
      expect(mockUpdateListsAndTodos).toHaveBeenCalledWith(
        mockSetLists,
        mockSetTodos,
        'list-1',
        'updated-category',
        'in-progress',
      );
    });

    it('newCategoryが空の場合、initialTitleが使用される', async () => {
      mockIsDuplicateCategory.mockReturnValue(false);
      mockApiRequest.mockResolvedValue({});

      const { result } = renderHook(() =>
        useUpdateStatusAndCategory({
          todos: mockInitialTodos,
          lists: mockInitialLists,
          setTodos: mockSetTodos,
          setLists: mockSetLists,
        }),
      );

      await act(async () => {
        await result.current.editList(
          'list-1',
          '', // 空のnewCategory
          'in-progress',
          'original-title',
        );
      });

      expect(mockIsDuplicateCategory).toHaveBeenCalledWith(
        mockInitialLists,
        'original-title', // initialTitleが使用される
        'list-1',
      );

      expect(mockApiRequest).toHaveBeenCalledWith('/api/lists', 'PUT', {
        type: 'update',
        id: 'list-1',
        data: { category: 'original-title' },
      });
    });

    it('重複するカテゴリの場合、アラートが表示され処理が中断される', async () => {
      mockIsDuplicateCategory.mockReturnValue(true);

      const { result } = renderHook(() =>
        useUpdateStatusAndCategory({
          todos: mockInitialTodos,
          lists: mockInitialLists,
          setTodos: mockSetTodos,
          setLists: mockSetLists,
        }),
      );

      let editResult;
      await act(async () => {
        editResult = await result.current.editList(
          'list-1',
          'duplicate-category',
          'in-progress',
          'in-progress',
        );
      });

      expect(editResult).toBe(false);
      expect(mockAlert).toHaveBeenCalledWith('リスト名が重複しています');
      expect(mockApiRequest).not.toHaveBeenCalled();
      expect(mockUpdateListsAndTodos).not.toHaveBeenCalled();
    });

    it('API呼び出しが失敗した場合、エラーがログに出力される', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockIsDuplicateCategory.mockReturnValue(false);
      mockApiRequest.mockRejectedValueOnce(new Error('API Error'));

      const { result } = renderHook(() =>
        useUpdateStatusAndCategory({
          todos: mockInitialTodos,
          lists: mockInitialLists,
          setTodos: mockSetTodos,
          setLists: mockSetLists,
        }),
      );

      let editResult;
      await act(async () => {
        editResult = await result.current.editList(
          'list-1',
          'updated-category',
          'in-progress',
          'in-progress',
        );
      });

      expect(editResult).toBe(true); // エラーが発生してもtrueが返される
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error puting list or todo:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });

    it('リスト更新は成功し、Todo更新が失敗した場合', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockIsDuplicateCategory.mockReturnValue(false);
      mockApiRequest
        .mockResolvedValueOnce({}) // リスト更新成功
        .mockRejectedValueOnce(new Error('Todo Update Error')); // Todo更新失敗

      const { result } = renderHook(() =>
        useUpdateStatusAndCategory({
          todos: mockInitialTodos,
          lists: mockInitialLists,
          setTodos: mockSetTodos,
          setLists: mockSetLists,
        }),
      );

      let editResult;
      await act(async () => {
        editResult = await result.current.editList(
          'list-1',
          'updated-category',
          'in-progress',
          'in-progress',
        );
      });

      expect(editResult).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error puting list or todo:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('依存配列の変更', () => {
    it('lists配列が変更された場合、フックが再実行される', () => {
      const { result, rerender } = renderHook(
        ({ lists }) =>
          useUpdateStatusAndCategory({
            todos: mockInitialTodos,
            lists,
            setTodos: mockSetTodos,
            setLists: mockSetLists,
          }),
        {
          initialProps: { lists: mockInitialLists },
        },
      );

      const initialEditList = result.current.editList;

      // 新しいlists配列で再レンダリング
      const newLists = [
        ...mockInitialLists,
        {
          id: 'new-list',
          category: 'new-category',
          number: 4,
        },
      ];

      rerender({ lists: newLists });

      // editList関数が新しく生成されることを確認
      expect(result.current.editList).not.toBe(initialEditList);
    });

    it('setLists関数が変更された場合、フックが再実行される', () => {
      const { result, rerender } = renderHook(
        ({ setLists }) =>
          useUpdateStatusAndCategory({
            todos: mockInitialTodos,
            lists: mockInitialLists,
            setTodos: mockSetTodos,
            setLists,
          }),
        {
          initialProps: { setLists: mockSetLists },
        },
      );

      const initialEditList = result.current.editList;

      // 新しいsetLists関数で再レンダリング
      const newSetLists = vi.fn();
      rerender({ setLists: newSetLists });

      // editList関数が新しく生成されることを確認
      expect(result.current.editList).not.toBe(initialEditList);
    });

    it('setTodos関数が変更された場合、フックが再実行される', () => {
      const { result, rerender } = renderHook(
        ({ setTodos }) =>
          useUpdateStatusAndCategory({
            todos: mockInitialTodos,
            lists: mockInitialLists,
            setTodos,
            setLists: mockSetLists,
          }),
        {
          initialProps: { setTodos: mockSetTodos },
        },
      );

      const initialEditList = result.current.editList;

      // 新しいsetTodos関数で再レンダリング
      const newSetTodos = vi.fn();
      rerender({ setTodos: newSetTodos });

      // editList関数が新しく生成されることを確認
      expect(result.current.editList).not.toBe(initialEditList);
    });
  });

  describe('エッジケース', () => {
    it('空のnewCategoryとinitialTitleでも処理が実行される', async () => {
      mockIsDuplicateCategory.mockReturnValue(false);
      mockApiRequest.mockResolvedValue({});

      const { result } = renderHook(() =>
        useUpdateStatusAndCategory({
          todos: mockInitialTodos,
          lists: mockInitialLists,
          setTodos: mockSetTodos,
          setLists: mockSetLists,
        }),
      );

      await act(async () => {
        await result.current.editList(
          'list-1',
          '', // 空のnewCategory
          'in-progress',
          '', // 空のinitialTitle
        );
      });

      // 空の文字列が最終的なカテゴリとして使用される
      expect(mockIsDuplicateCategory).toHaveBeenCalledWith(
        mockInitialLists,
        '', // 空の文字列
        'list-1',
      );

      expect(mockApiRequest).toHaveBeenCalledWith('/api/lists', 'PUT', {
        type: 'update',
        id: 'list-1',
        data: { category: '' },
      });
    });

    it('存在しないリストIDでも処理が実行される', async () => {
      mockIsDuplicateCategory.mockReturnValue(false);
      mockApiRequest.mockResolvedValue({});

      const { result } = renderHook(() =>
        useUpdateStatusAndCategory({
          todos: mockInitialTodos,
          lists: mockInitialLists,
          setTodos: mockSetTodos,
          setLists: mockSetLists,
        }),
      );

      let editResult;
      await act(async () => {
        editResult = await result.current.editList(
          'non-existent-list',
          'updated-category',
          'in-progress',
          'in-progress',
        );
      });

      expect(editResult).toBe(true);
      expect(mockApiRequest).toHaveBeenCalledWith('/api/lists', 'PUT', {
        type: 'update',
        id: 'non-existent-list',
        data: { category: 'updated-category' },
      });
    });

    it('nullやundefinedの値でも処理が実行される', async () => {
      mockIsDuplicateCategory.mockReturnValue(false);
      mockApiRequest.mockResolvedValue({});

      const { result } = renderHook(() =>
        useUpdateStatusAndCategory({
          todos: mockInitialTodos,
          lists: mockInitialLists,
          setTodos: mockSetTodos,
          setLists: mockSetLists,
        }),
      );

      await act(async () => {
        await result.current.editList(
          'list-1',
          null as unknown as string,
          'in-progress',
          'fallback-title',
        );
      });

      // null値の場合、initialTitleが使用される
      expect(mockIsDuplicateCategory).toHaveBeenCalledWith(
        mockInitialLists,
        'fallback-title',
        'list-1',
      );
    });
  });
});
