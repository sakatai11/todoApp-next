import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { TodoProvider, useTodoContext } from '@/features/todo/contexts/TodoContext';
import { mockTodos, mockLists } from '@/tests/test-utils';
import { TodoListProps } from '@/types/todos';
import { StatusListProps } from '@/types/lists';
import { Timestamp } from 'firebase-admin/firestore';

// Wrapper component for hooks testing
const createWrapper = (
  initialTodos: TodoListProps[] = mockTodos,
  initialLists: StatusListProps[] = mockLists
) => {
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <TodoProvider initialTodos={initialTodos} initialLists={initialLists}>
      {children}
    </TodoProvider>
  );
  TestWrapper.displayName = 'TestWrapper';
  return TestWrapper;
};

describe('TodoContext', () => {
  describe('Context Provider', () => {
    it('初期データでコンテキストが正しく初期化される', () => {
      const { result } = renderHook(() => useTodoContext(), {
        wrapper: createWrapper(),
      });

      expect(result.current.todoHooks.todos).toEqual(mockTodos);
      expect(result.current.listHooks.lists).toEqual(mockLists);
    });

    it('空のデータでもコンテキストが正しく初期化される', () => {
      const { result } = renderHook(() => useTodoContext(), {
        wrapper: createWrapper([], []),
      });

      expect(result.current.todoHooks.todos).toEqual([]);
      expect(result.current.listHooks.lists).toEqual([]);
    });

    it('必要なhooksがすべて利用可能である', () => {
      const { result } = renderHook(() => useTodoContext(), {
        wrapper: createWrapper(),
      });

      const context = result.current;

      // todoHooks
      expect(context.todoHooks).toBeDefined();
      expect(context.todoHooks.todos).toBeDefined();
      expect(context.todoHooks.input).toBeDefined();
      expect(context.todoHooks.addTodo).toBeDefined();
      expect(context.todoHooks.deleteTodo).toBeDefined();
      expect(context.todoHooks.editTodo).toBeDefined();
      expect(context.todoHooks.saveTodo).toBeDefined();
      expect(context.todoHooks.toggleSelected).toBeDefined();

      // listHooks
      expect(context.listHooks).toBeDefined();
      expect(context.listHooks.lists).toBeDefined();
      expect(context.listHooks.addList).toBeDefined();
      expect(context.listHooks.handleDragEnd).toBeDefined();

      // updateStatusAndCategoryHooks
      expect(context.updateStatusAndCategoryHooks).toBeDefined();
      expect(context.updateStatusAndCategoryHooks.editList).toBeDefined();

      // deleteListHooks
      expect(context.deleteListHooks).toBeDefined();
      expect(context.deleteListHooks.deleteList).toBeDefined();
    });
  });

  describe('Context Error Handling', () => {
    it('プロバイダー外でのコンテキスト使用時にエラーがスローされる', () => {
      // コンソールエラーを抑制
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useTodoContext());
      }).toThrow('useTodoContext must be used within a TodoProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('Integration with Child Hooks', () => {
    it('todoHooksとlistHooksが正しく連携している', () => {
      const { result } = renderHook(() => useTodoContext(), {
        wrapper: createWrapper(),
      });

      const context = result.current;
      
      // 初期状態の確認（サブモジュールのモックデータを使用）
      expect(context.todoHooks.todos.length).toBe(5); // mockTodosの件数
      expect(context.listHooks.lists.length).toBe(3); // mockListsの件数
    });

    it('updateStatusAndCategoryHooksが必要な依存関係を受け取っている', () => {
      const { result } = renderHook(() => useTodoContext(), {
        wrapper: createWrapper(),
      });

      const context = result.current;
      
      // updateStatusAndCategoryHooksが関数として定義されていることを確認
      expect(typeof context.updateStatusAndCategoryHooks.editList).toBe('function');
    });

    it('deleteListHooksが必要な依存関係を受け取っている', () => {
      const { result } = renderHook(() => useTodoContext(), {
        wrapper: createWrapper(),
      });

      const context = result.current;
      
      // deleteListHooksが関数として定義されていることを確認
      expect(typeof context.deleteListHooks.deleteList).toBe('function');
    });
  });

  describe('State Consistency', () => {
    it('異なるhooks間で状態が一貫している', () => {
      const customTodos: TodoListProps[] = [
        {
          id: 'test-1',
          text: 'Custom Todo 1',
          status: 'pending',
          bool: false,
          createdTime: Timestamp.fromDate(new Date()),
          updateTime: Timestamp.fromDate(new Date()),
        },
        {
          id: 'test-2',
          text: 'Custom Todo 2',
          status: 'completed',
          bool: true,
          createdTime: Timestamp.fromDate(new Date()),
          updateTime: Timestamp.fromDate(new Date()),
        },
      ];

      const customLists: StatusListProps[] = [
        { id: 'list-1', category: 'pending', number: 1 },
        { id: 'list-2', category: 'completed', number: 2 },
      ];

      const { result } = renderHook(() => useTodoContext(), {
        wrapper: createWrapper(customTodos, customLists),
      });

      const context = result.current;
      
      expect(context.todoHooks.todos).toEqual(customTodos);
      expect(context.listHooks.lists).toEqual(customLists);
    });
  });
});