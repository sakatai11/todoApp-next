import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isDuplicateCategory,
  updateListsAndTodos,
} from '@/features/utils/updateStatusUtils';
import { StatusListProps } from '@/types/lists';
import { TodoListProps } from '@/types/todos';
import { mockTodos, mockLists } from '@/tests/test-utils';

// サブモジュールのモックデータを使用
const mockInitialTodos: TodoListProps[] = mockTodos;
const mockInitialLists: StatusListProps[] = mockLists;

describe('updateStatusUtils', () => {
  describe('isDuplicateCategory', () => {
    it('重複するカテゴリが存在する場合、trueを返す', () => {
      const result = isDuplicateCategory(
        mockInitialLists,
        'in-progress',
        'different-id',
      );
      expect(result).toBe(true);
    });

    it('重複するカテゴリが存在しない場合、falseを返す', () => {
      const result = isDuplicateCategory(
        mockInitialLists,
        'new-category',
        'different-id',
      );
      expect(result).toBe(false);
    });

    it('同じIDのアイテムは重複として扱われない', () => {
      const result = isDuplicateCategory(
        mockInitialLists,
        'in-progress',
        'list-1',
      );
      expect(result).toBe(false);
    });

    it('空の配列の場合、常にfalseを返す', () => {
      const result = isDuplicateCategory([], 'any-category', 'any-id');
      expect(result).toBe(false);
    });

    it('カテゴリ名が空文字列の場合でも正常に動作する', () => {
      const listsWithEmptyCategory = [
        { id: 'empty-1', category: '', number: 1 },
        { id: 'empty-2', category: 'normal', number: 2 },
      ];

      const result = isDuplicateCategory(
        listsWithEmptyCategory,
        '',
        'different-id',
      );
      expect(result).toBe(true);
    });

    it('大文字小文字が異なる場合は重複として扱われない', () => {
      const result = isDuplicateCategory(
        mockInitialLists,
        'IN-PROGRESS',
        'different-id',
      );
      expect(result).toBe(false);
    });

    it('スペースを含むカテゴリ名でも正常に動作する', () => {
      const listsWithSpaces = [
        { id: 'space-1', category: 'with space', number: 1 },
        { id: 'space-2', category: 'normal', number: 2 },
      ];

      const result = isDuplicateCategory(
        listsWithSpaces,
        'with space',
        'different-id',
      );
      expect(result).toBe(true);
    });

    it('特殊文字を含むカテゴリ名でも正常に動作する', () => {
      const listsWithSpecialChars = [
        { id: 'special-1', category: 'test@#$%', number: 1 },
        { id: 'special-2', category: 'normal', number: 2 },
      ];

      const result = isDuplicateCategory(
        listsWithSpecialChars,
        'test@#$%',
        'different-id',
      );
      expect(result).toBe(true);
    });

    it('nullやundefinedのIDでも正常に動作する', () => {
      const result = isDuplicateCategory(
        mockInitialLists,
        'in-progress',
        null as unknown as string,
      );
      expect(result).toBe(true);
    });

    it('数値のカテゴリ名でも正常に動作する', () => {
      const listsWithNumbers = [
        { id: 'num-1', category: '123', number: 1 },
        { id: 'num-2', category: 'normal', number: 2 },
      ];

      const result = isDuplicateCategory(
        listsWithNumbers,
        '123',
        'different-id',
      );
      expect(result).toBe(true);
    });
  });

  describe('updateListsAndTodos', () => {
    let mockSetLists: ReturnType<typeof vi.fn>;
    let mockSetTodos: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockSetLists = vi.fn();
      mockSetTodos = vi.fn();
    });

    it('リストとTodoの更新が正しく実行される', () => {
      updateListsAndTodos(
        mockSetLists,
        mockSetTodos,
        'list-1',
        'updated-category',
        'in-progress',
      );

      // setListsが関数で呼び出されることを確認
      expect(mockSetLists).toHaveBeenCalledWith(expect.any(Function));

      // setListsに渡された関数を実行してテスト
      const updateListsFunction = mockSetLists.mock.calls[0][0];
      const updatedLists = updateListsFunction(mockInitialLists);

      // 指定されたIDのリストのカテゴリが更新されることを確認
      const updatedList = updatedLists.find(
        (list: StatusListProps) => list.id === 'list-1',
      );
      expect(updatedList?.category).toBe('updated-category');

      // 他のリストは変更されないことを確認
      const otherLists = updatedLists.filter(
        (list: StatusListProps) => list.id !== 'list-1',
      );
      otherLists.forEach((list: StatusListProps) => {
        const originalList = mockInitialLists.find(
          (original) => original.id === list.id,
        );
        expect(list.category).toBe(originalList?.category);
      });
    });

    it('存在しないIDでも処理が実行される', () => {
      updateListsAndTodos(
        mockSetLists,
        mockSetTodos,
        'non-existent-id',
        'updated-category',
        'in-progress',
      );

      expect(mockSetLists).toHaveBeenCalledWith(expect.any(Function));

      const updateListsFunction = mockSetLists.mock.calls[0][0];
      const updatedLists = updateListsFunction(mockInitialLists);

      // 元の配列と同じ内容になることを確認
      expect(updatedLists).toEqual(mockInitialLists);
    });

    it('setTodos関数がsetLists内で呼び出される', () => {
      updateListsAndTodos(
        mockSetLists,
        mockSetTodos,
        'list-1',
        'updated-category',
        'in-progress',
      );

      // setListsが呼び出された後、その内部でsetTodosが呼び出される
      const updateListsFunction = mockSetLists.mock.calls[0][0];
      updateListsFunction(mockInitialLists);

      expect(mockSetTodos).toHaveBeenCalledWith(expect.any(Function));
    });

    it('Todo更新関数が正常に動作する', () => {
      updateListsAndTodos(
        mockSetLists,
        mockSetTodos,
        'list-1',
        'updated-category',
        'in-progress',
      );

      // setListsの関数を実行してsetTodosの呼び出しをトリガー
      const updateListsFunction = mockSetLists.mock.calls[0][0];
      updateListsFunction(mockInitialLists);

      // setTodosに渡された関数を取得
      const updateTodosFunction = mockSetTodos.mock.calls[0][0];
      const updatedTodos = updateTodosFunction(mockInitialTodos);

      // 旧ステータス 'in-progress' のTodoが新ステータス 'updated-category' に更新されることを確認
      const updatedTodosWithOldStatus = updatedTodos.filter(
        (todo: TodoListProps) => todo.status === 'updated-category',
      );
      const originalTodosWithOldStatus = mockInitialTodos.filter(
        (todo: TodoListProps) => todo.status === 'in-progress',
      );

      expect(updatedTodosWithOldStatus).toHaveLength(
        originalTodosWithOldStatus.length,
      );
    });

    it('該当するステータスのTodoがない場合でも処理が実行される', () => {
      updateListsAndTodos(
        mockSetLists,
        mockSetTodos,
        'list-1',
        'updated-category',
        'non-existent-status',
      );

      const updateListsFunction = mockSetLists.mock.calls[0][0];
      updateListsFunction(mockInitialLists);

      const updateTodosFunction = mockSetTodos.mock.calls[0][0];
      const updatedTodos = updateTodosFunction(mockInitialTodos);

      // Todoの配列は変更されないことを確認
      expect(updatedTodos).toEqual(mockInitialTodos);
    });

    it('空のリスト配列でも処理が実行される', () => {
      updateListsAndTodos(
        mockSetLists,
        mockSetTodos,
        'list-1',
        'updated-category',
        'in-progress',
      );

      const updateListsFunction = mockSetLists.mock.calls[0][0];
      const updatedLists = updateListsFunction([]);

      // 空の配列が返されることを確認
      expect(updatedLists).toEqual([]);
    });

    it('空のTodo配列でも処理が実行される', () => {
      updateListsAndTodos(
        mockSetLists,
        mockSetTodos,
        'list-1',
        'updated-category',
        'in-progress',
      );

      const updateListsFunction = mockSetLists.mock.calls[0][0];
      updateListsFunction(mockInitialLists);

      const updateTodosFunction = mockSetTodos.mock.calls[0][0];
      const updatedTodos = updateTodosFunction([]);

      // 空の配列が返されることを確認
      expect(updatedTodos).toEqual([]);
    });

    it('カテゴリ名が空文字列でも正しく更新される', () => {
      updateListsAndTodos(
        mockSetLists,
        mockSetTodos,
        'list-1',
        '', // 空文字列
        'in-progress',
      );

      const updateListsFunction = mockSetLists.mock.calls[0][0];
      const updatedLists = updateListsFunction(mockInitialLists);

      const updatedList = updatedLists.find(
        (list: StatusListProps) => list.id === 'list-1',
      );
      expect(updatedList?.category).toBe('');
    });

    it('特殊文字を含むカテゴリ名でも正しく更新される', () => {
      const specialCategory = 'test@#$%^&*()';

      updateListsAndTodos(
        mockSetLists,
        mockSetTodos,
        'list-1',
        specialCategory,
        'in-progress',
      );

      const updateListsFunction = mockSetLists.mock.calls[0][0];
      const updatedLists = updateListsFunction(mockInitialLists);

      const updatedList = updatedLists.find(
        (list: StatusListProps) => list.id === 'list-1',
      );
      expect(updatedList?.category).toBe(specialCategory);
    });

    it('複数のTodoが同じステータスを持つ場合、すべて更新される', () => {
      // 'in-progress' ステータスのTodoが複数存在することを確認
      const inProgressTodos = mockInitialTodos.filter(
        (todo) => todo.status === 'in-progress',
      );
      expect(inProgressTodos.length).toBeGreaterThan(0);

      updateListsAndTodos(
        mockSetLists,
        mockSetTodos,
        'list-1',
        'all-updated',
        'in-progress',
      );

      const updateListsFunction = mockSetLists.mock.calls[0][0];
      updateListsFunction(mockInitialLists);

      const updateTodosFunction = mockSetTodos.mock.calls[0][0];
      const updatedTodos = updateTodosFunction(mockInitialTodos);

      // すべての 'in-progress' Todoが 'all-updated' に更新されることを確認
      const updatedInProgressTodos = updatedTodos.filter(
        (todo: TodoListProps) => todo.status === 'all-updated',
      );
      expect(updatedInProgressTodos).toHaveLength(inProgressTodos.length);

      // 元の 'in-progress' Todoがもう存在しないことを確認
      const remainingInProgressTodos = updatedTodos.filter(
        (todo: TodoListProps) => todo.status === 'in-progress',
      );
      expect(remainingInProgressTodos).toHaveLength(0);
    });
  });
});
