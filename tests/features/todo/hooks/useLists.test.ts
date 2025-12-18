import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLists } from '@/features/todo/hooks/useLists';
import { StatusListProps } from '@/types/lists';
import { mockLists } from '@/tests/test-utils';
import { ERROR_MESSAGES } from '@/constants/errorMessages';

// Mock apiRequest
vi.mock('@/features/libs/apis', () => ({
  apiRequest: vi.fn(),
}));

// Mock useError
const mockShowError = vi.fn();
vi.mock('@/features/todo/contexts/ErrorContext', () => ({
  useError: () => ({
    showError: mockShowError,
  }),
}));

// Mock @dnd-kit/sortable
vi.mock('@dnd-kit/sortable', () => ({
  arrayMove: vi.fn((array, from, to) => {
    const newArray = [...array];
    const item = newArray.splice(from, 1)[0];
    newArray.splice(to, 0, item);
    return newArray;
  }),
}));

// Get the mocked function
import { apiRequest } from '@/features/libs/apis';
import { arrayMove } from '@dnd-kit/sortable';
const mockApiRequest = vi.mocked(apiRequest);
const mockArrayMove = vi.mocked(arrayMove);

// サブモジュールのモックデータを使用
const mockInitialLists: StatusListProps[] = mockLists;

// ヘルパー関数: モックドラッグイベントを作成
const createMockDragEvent = (activeId: string, overId: string | null) =>
  ({
    active: { id: activeId },
    over: overId ? { id: overId } : null,
    activatorEvent: new Event('pointerdown'),
    collisions: [],
    delta: { x: 0, y: 0 },
  }) as unknown as import('@dnd-kit/core').DragEndEvent;

describe('useLists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('初期化', () => {
    it('初期listsで正しく初期化される', () => {
      const { result } = renderHook(() => useLists(mockInitialLists));

      expect(result.current.lists).toEqual(mockInitialLists);
      expect(result.current.input).toEqual({ status: '' });
      expect(result.current.validationError).toEqual({
        addListNull: false,
        addListSame: false,
      });
    });

    it('空の配列で初期化される', () => {
      const { result } = renderHook(() => useLists([]));
      expect(result.current.lists).toEqual([]);
    });
  });

  describe('状態更新', () => {
    it('inputが正しく更新される', () => {
      const { result } = renderHook(() => useLists(mockInitialLists));

      act(() => {
        result.current.setInput({ status: 'new-status' });
      });

      expect(result.current.input.status).toBe('new-status');
    });

    it('listsが正しく更新される', () => {
      const { result } = renderHook(() => useLists(mockInitialLists));

      const newLists = [
        ...mockInitialLists,
        {
          id: 'new-list',
          category: 'new-category',
          number: 4,
        },
      ];

      act(() => {
        result.current.setLists(newLists);
      });

      expect(result.current.lists).toEqual(newLists);
    });

    it('errorが正しく更新される', () => {
      const { result } = renderHook(() => useLists(mockInitialLists));

      act(() => {
        result.current.setValidationError({
          addListNull: true,
          addListSame: false,
        });
      });

      expect(result.current.validationError.addListNull).toBe(true);
      expect(result.current.validationError.addListSame).toBe(false);
    });
  });

  describe('重複チェック (checkDuplicateCategory)', () => {
    it('既存のカテゴリは重複として検出される', () => {
      const { result } = renderHook(() => useLists(mockInitialLists));

      // 'in-progress'は既存のカテゴリ
      expect(
        result.current.lists.some((list) => list.category === 'in-progress'),
      ).toBe(true);
    });

    it('新しいカテゴリは重複として検出されない', () => {
      const { result } = renderHook(() => useLists(mockInitialLists));

      // 'new-category'は新しいカテゴリ
      expect(
        result.current.lists.some((list) => list.category === 'new-category'),
      ).toBe(false);
    });
  });

  describe('リスト追加 (addList)', () => {
    it('正常にリストが追加される', async () => {
      const newList = {
        id: 'new-list-id',
        category: 'new-status',
        number: 4,
      };

      mockApiRequest.mockResolvedValueOnce(newList);

      const { result } = renderHook(() => useLists(mockInitialLists));

      act(() => {
        result.current.setInput({ status: 'new-status' });
      });

      let addResult;
      await act(async () => {
        addResult = await result.current.addList();
      });

      expect(addResult).toBe(true);
      expect(mockApiRequest).toHaveBeenCalledWith(
        '/api/lists',
        'POST',
        expect.objectContaining({
          category: 'new-status',
          number: 4,
        }),
      );
      expect(result.current.lists).toHaveLength(4);
      expect(result.current.input).toEqual({ status: '' });
      expect(result.current.validationError.addListNull).toBe(false);
      expect(result.current.validationError.addListSame).toBe(false);
    });

    it('入力が空の場合はエラーになる', async () => {
      const { result } = renderHook(() => useLists(mockInitialLists));

      let addResult;
      await act(async () => {
        addResult = await result.current.addList();
      });

      expect(addResult).toBe(false);
      expect(result.current.validationError.addListNull).toBe(true);
      expect(result.current.validationError.addListSame).toBe(false);
      expect(mockApiRequest).not.toHaveBeenCalled();
    });

    it('重複するカテゴリの場合はエラーになる', async () => {
      const { result } = renderHook(() => useLists(mockInitialLists));

      act(() => {
        result.current.setInput({ status: 'in-progress' }); // 既存のカテゴリ
      });

      let addResult;
      await act(async () => {
        addResult = await result.current.addList();
      });

      expect(addResult).toBe(false);
      expect(result.current.validationError.addListNull).toBe(false);
      expect(result.current.validationError.addListSame).toBe(true);
      expect(mockApiRequest).not.toHaveBeenCalled();
    });

    it('API呼び出しが失敗した場合はエラーになる', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockApiRequest.mockRejectedValueOnce(new Error('API Error'));

      const { result } = renderHook(() => useLists(mockInitialLists));

      act(() => {
        result.current.setInput({ status: 'new-status' });
      });

      let addResult;
      await act(async () => {
        addResult = await result.current.addList();
      });

      expect(addResult).toBe(false);
      expect(mockShowError).toHaveBeenCalledWith(
        ERROR_MESSAGES.LIST.ADD_FAILED,
      );

      consoleSpy.mockRestore();
    });

    it('番号の再計算が正しく行われる', async () => {
      const newList = {
        id: 'new-list-id',
        category: 'new-status',
        number: 4,
      };

      mockApiRequest.mockResolvedValueOnce(newList);

      const { result } = renderHook(() => useLists(mockInitialLists));

      act(() => {
        result.current.setInput({ status: 'new-status' });
      });

      await act(async () => {
        await result.current.addList();
      });

      // 既存のリストが3つあるので、新しいリストは4番目になる
      expect(mockApiRequest).toHaveBeenCalledWith(
        '/api/lists',
        'POST',
        expect.objectContaining({
          category: 'new-status',
          number: 4,
        }),
      );
    });
  });

  describe('ドラッグ&ドロップ (handleDragEnd)', () => {
    it('正常にリストが並び替えられる', async () => {
      mockApiRequest.mockResolvedValueOnce({});

      const { result } = renderHook(() => useLists(mockInitialLists));

      const dragEvent = createMockDragEvent('list-1', 'list-3');

      await act(async () => {
        await result.current.handleDragEnd(dragEvent);
      });

      expect(mockArrayMove).toHaveBeenCalledWith(
        mockInitialLists,
        0, // list-1のindex
        2, // list-3のindex
      );

      expect(mockApiRequest).toHaveBeenCalledWith(
        '/api/lists',
        'PUT',
        expect.objectContaining({
          type: 'reorder',
          data: expect.any(Array),
        }),
      );
    });

    it('over要素がない場合は何もしない', async () => {
      const { result } = renderHook(() => useLists(mockInitialLists));

      const dragEvent = createMockDragEvent('list-1', null);

      await act(async () => {
        await result.current.handleDragEnd(dragEvent);
      });

      expect(mockArrayMove).not.toHaveBeenCalled();
      expect(mockApiRequest).not.toHaveBeenCalled();
    });

    it('同じ位置にドロップした場合は何もしない', async () => {
      const { result } = renderHook(() => useLists(mockInitialLists));

      const dragEvent = createMockDragEvent('list-1', 'list-1');

      await act(async () => {
        await result.current.handleDragEnd(dragEvent);
      });

      expect(mockArrayMove).not.toHaveBeenCalled();
      expect(mockApiRequest).not.toHaveBeenCalled();
    });

    it('API呼び出しが失敗してもクライアント側の更新は実行される', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockApiRequest.mockRejectedValueOnce(new Error('API Error'));

      const { result } = renderHook(() => useLists(mockInitialLists));

      const dragEvent = createMockDragEvent('list-1', 'list-3');

      await act(async () => {
        await result.current.handleDragEnd(dragEvent);
      });

      expect(mockArrayMove).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('ボタン移動 (handleButtonMove)', () => {
    it('右方向に正常に移動される', async () => {
      mockApiRequest.mockResolvedValueOnce({});

      const { result } = renderHook(() => useLists(mockInitialLists));

      await act(async () => {
        await result.current.handleButtonMove('list-1', 'right');
      });

      expect(mockArrayMove).toHaveBeenCalledWith(
        mockInitialLists,
        0, // list-1のindex
        1, // 右に1つ移動
      );

      expect(mockApiRequest).toHaveBeenCalledWith(
        '/api/lists',
        'PUT',
        expect.objectContaining({
          type: 'reorder',
          data: expect.any(Array),
        }),
      );
    });

    it('左方向に正常に移動される', async () => {
      mockApiRequest.mockResolvedValueOnce({});

      const { result } = renderHook(() => useLists(mockInitialLists));

      await act(async () => {
        await result.current.handleButtonMove('list-2', 'left');
      });

      expect(mockArrayMove).toHaveBeenCalledWith(
        mockInitialLists,
        1, // list-2のindex
        0, // 左に1つ移動
      );
    });

    it('右端のアイテムを右に移動しても変化しない', async () => {
      const { result } = renderHook(() => useLists(mockInitialLists));

      await act(async () => {
        const moveResult = await result.current.handleButtonMove(
          'list-3',
          'right',
        );
        expect(moveResult).toEqual(mockInitialLists);
      });

      expect(mockArrayMove).not.toHaveBeenCalled();
      expect(mockApiRequest).not.toHaveBeenCalled();
    });

    it('左端のアイテムを左に移動しても変化しない', async () => {
      const { result } = renderHook(() => useLists(mockInitialLists));

      await act(async () => {
        const moveResult = await result.current.handleButtonMove(
          'list-1',
          'left',
        );
        expect(moveResult).toEqual(mockInitialLists);
      });

      expect(mockArrayMove).not.toHaveBeenCalled();
      expect(mockApiRequest).not.toHaveBeenCalled();
    });

    it('存在しないIDでは何もしない', async () => {
      const { result } = renderHook(() => useLists(mockInitialLists));

      await act(async () => {
        await result.current.handleButtonMove('non-existent-id', 'right');
      });

      expect(mockArrayMove).not.toHaveBeenCalled();
      expect(mockApiRequest).not.toHaveBeenCalled();
    });

    it('空のIDでは何もしない', async () => {
      const { result } = renderHook(() => useLists(mockInitialLists));

      await act(async () => {
        await result.current.handleButtonMove('', 'right');
      });

      expect(mockArrayMove).not.toHaveBeenCalled();
      expect(mockApiRequest).not.toHaveBeenCalled();
    });

    it('API呼び出しが失敗してもクライアント側の更新は実行される', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockApiRequest.mockRejectedValueOnce(new Error('API Error'));

      const { result } = renderHook(() => useLists(mockInitialLists));

      await act(async () => {
        await result.current.handleButtonMove('list-1', 'right');
      });

      expect(mockArrayMove).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('番号の再計算', () => {
    it('ドラッグ&ドロップ後に番号が正しく再計算される', async () => {
      mockApiRequest.mockResolvedValueOnce({});

      const { result } = renderHook(() => useLists(mockInitialLists));

      const dragEvent = createMockDragEvent('list-1', 'list-3');

      await act(async () => {
        await result.current.handleDragEnd(dragEvent);
      });

      // 並び替え後の配列をmockArrayMoveが返すことを確認
      expect(mockArrayMove).toHaveBeenCalledWith(mockInitialLists, 0, 2);
    });

    it('ボタン移動後に番号が正しく再計算される', async () => {
      mockApiRequest.mockResolvedValueOnce({});

      const { result } = renderHook(() => useLists(mockInitialLists));

      await act(async () => {
        await result.current.handleButtonMove('list-1', 'right');
      });

      // 移動後の配列をmockArrayMoveが返すことを確認
      expect(mockArrayMove).toHaveBeenCalledWith(mockInitialLists, 0, 1);
    });
  });
});
