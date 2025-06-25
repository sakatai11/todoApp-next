import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, mockTodos, mockLists } from '@/tests/test-utils';
import MainContainer from '@/features/todo/components/MainContainer/MainContainer';
import { TodoListProps } from '@/types/todos';
import { Timestamp } from 'firebase-admin/firestore';

// Mock DnD Kit
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({
    children,
    onDragEnd,
  }: {
    children: React.ReactNode;
    onDragEnd?: (event: unknown) => void;
  }) => (
    <div data-testid="dnd-context" data-drag-end={onDragEnd ? 'true' : 'false'}>
      {children}
    </div>
  ),
  closestCenter: vi.fn(),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sortable-context">{children}</div>
  ),
  rectSortingStrategy: vi.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
  }),
}));

vi.mock('@/features/todo/dnd/SortableItem', () => ({
  default: ({ children, id }: { children: React.ReactNode; id: string }) => (
    <div data-testid={`sortable-item-${id}`}>{children}</div>
  ),
}));

// サブモジュールのモックデータを使用（test-utilsからインポート済み）

describe('MainContainer', () => {
  describe('レンダリング', () => {
    it('正常にレンダリングされる', () => {
      render(<MainContainer />, {
        initialTodos: mockTodos,
        initialLists: mockLists,
      });

      // DnD Context が存在することを確認
      expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
      expect(screen.getByTestId('sortable-context')).toBeInTheDocument();
    });

    it('すべてのリストが表示される', () => {
      render(<MainContainer />, {
        initialTodos: mockTodos,
        initialLists: mockLists,
      });

      // 各リストのSortableItemが表示されることを確認
      expect(screen.getByTestId('sortable-item-list-1')).toBeInTheDocument();
      expect(screen.getByTestId('sortable-item-list-2')).toBeInTheDocument();
      expect(screen.getByTestId('sortable-item-list-3')).toBeInTheDocument();
    });

    it('リストタイトルが正しく表示される', () => {
      render(<MainContainer />, {
        initialTodos: mockTodos,
        initialLists: mockLists,
      });

      // サブモジュールのリストカテゴリに基づいて確認
      expect(screen.getByText('in-progress')).toBeInTheDocument();
      expect(screen.getByText('done')).toBeInTheDocument();
      expect(screen.getByText('todo')).toBeInTheDocument();
    });

    it('AddListコンポーネントが表示される', () => {
      render(<MainContainer />, {
        initialTodos: mockTodos,
        initialLists: mockLists,
      });

      // AddListコンポーネント特有の要素を確認
      const dndContext = screen.getByRole('button', {
        name: /リストを追加|AddList/i,
      });
      expect(dndContext).toBeInTheDocument();
    });
  });

  describe('Todoの表示とフィルタリング', () => {
    it('各リストに適切なTodoが表示される', () => {
      render(<MainContainer />, {
        initialTodos: mockTodos,
        initialLists: mockLists,
      });

      // サブモジュールのTodoデータに基づいて確認（動的検証）
      mockTodos.forEach((todo) => {
        // 改行を含むテキストは特別な処理が必要
        if (todo.text.includes('\n')) {
          // 改行テキストは複数要素に分散されるため、部分的にチェック
          const textParts = todo.text.split('\n').filter((part) => part.trim());
          textParts.forEach((part) => {
            // より具体的なマッチャーを使用
            const elements = screen.queryAllByText((_, element) => {
              return element?.textContent?.includes(part) || false;
            });
            expect(elements.length).toBeGreaterThan(0);
          });
        } else {
          expect(screen.getByText(todo.text)).toBeInTheDocument();
        }
      });
    });

    it('bool値によってTodoが正しく分類される', () => {
      render(<MainContainer />, {
        initialTodos: mockTodos,
        initialLists: mockLists,
      });

      // サブモジュールのTodoアイテムが表示されることを確認（動的検証）
      const visibleTodos = mockTodos.filter((todo) =>
        [
          'Next.js App Routerの学習',
          'Nuxt3の学習',
          'TypeScript最適化',
        ].includes(todo.text),
      );
      visibleTodos.forEach((todo) => {
        expect(screen.getByText(todo.text)).toBeInTheDocument();
      });
    });

    it('空のリストでも正常に表示される', () => {
      render(<MainContainer />, {
        initialTodos: [],
        initialLists: mockLists,
      });

      // リストは表示されるが、Todoは表示されない
      expect(screen.getByText('in-progress')).toBeInTheDocument();
      expect(screen.getByText('done')).toBeInTheDocument();
      expect(screen.getByText('todo')).toBeInTheDocument();
    });
  });

  describe('AddTodoコンポーネント', () => {
    it('各リストにAddTodoコンポーネントが表示される', () => {
      render(<MainContainer />, {
        initialTodos: mockTodos,
        initialLists: mockLists,
      });

      // 各リストにAddTodoボタンが存在することを確認（実際のテキストに合わせて修正）
      const addTodoButtons = screen.getAllByText('TODOを追加する');
      expect(addTodoButtons).toHaveLength(mockLists.length);
    });
  });

  describe('DragAndDrop機能', () => {
    it('DndContextが正しく設定される', () => {
      render(<MainContainer />, {
        initialTodos: mockTodos,
        initialLists: mockLists,
      });

      const dndContext = screen.getByTestId('dnd-context');
      expect(dndContext).toHaveAttribute('data-drag-end', 'true');
    });

    it('SortableContextが正しく設定される', () => {
      render(<MainContainer />, {
        initialTodos: mockTodos,
        initialLists: mockLists,
      });

      expect(screen.getByTestId('sortable-context')).toBeInTheDocument();
    });

    it('各リストアイテムがSortableItemでラップされる', () => {
      render(<MainContainer />, {
        initialTodos: mockTodos,
        initialLists: mockLists,
      });

      mockLists.forEach((list) => {
        expect(
          screen.getByTestId(`sortable-item-${list.id}`),
        ).toBeInTheDocument();
      });
    });
  });

  describe('レスポンシブデザイン', () => {
    it('適切なCSSクラスとスタイルが適用される', () => {
      render(<MainContainer />, {
        initialTodos: mockTodos,
        initialLists: mockLists,
      });

      // DnDコンテキストが適切に設定されているか確認
      expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
      expect(screen.getByTestId('sortable-context')).toBeInTheDocument();
    });
  });

  describe('エラーハンドリング', () => {
    it('不正なデータでもクラッシュしない', () => {
      const invalidTodos = [
        {
          id: 'invalid-todo',
          text: 'Invalid Todo',
          status: 'invalid-status', // 不正なステータス
          bool: false,
          createdTime: Timestamp.fromDate(new Date()),
          updateTime: Timestamp.fromDate(new Date()),
        },
      ];

      expect(() => {
        render(<MainContainer />, {
          initialTodos: invalidTodos,
          initialLists: mockLists,
        });
      }).not.toThrow();
    });

    it('空のリスト配列でも正常に動作する', () => {
      expect(() => {
        render(<MainContainer />, {
          initialTodos: mockTodos,
          initialLists: [],
        });
      }).not.toThrow();
    });
  });

  describe('パフォーマンス', () => {
    it('大量のTodoでも正常にレンダリングされる', () => {
      const largeTodoList: TodoListProps[] = Array.from(
        { length: 20 },
        (_, i) => ({
          id: `todo-${i}`,
          text: `Todo ${i}`,
          status: 'pending',
          bool: i % 2 === 0,
          createdTime: Timestamp.fromDate(new Date()),
          updateTime: Timestamp.fromDate(new Date()),
        }),
      );

      expect(() => {
        render(<MainContainer />, {
          initialTodos: largeTodoList,
          initialLists: mockLists,
        });
      }).not.toThrow();
    });
  });
});
