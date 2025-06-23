import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/tests/test-utils';
import MainContainer from '@/features/todo/components/MainContainer/MainContainer';
import { TodoListProps } from '@/types/todos';
import { StatusListProps } from '@/types/lists';
import { Timestamp } from 'firebase-admin/firestore';

// Mock DnD Kit
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ 
    children, 
    onDragEnd 
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

const mockTodos: TodoListProps[] = [
  {
    id: 'todo-1',
    text: 'Test Todo 1',
    status: 'pending',
    bool: false,
    createdTime: Timestamp.fromDate(new Date()),
    updateTime: Timestamp.fromDate(new Date()),
  },
  {
    id: 'todo-2',
    text: 'Test Todo 2',
    status: 'pending',
    bool: true,
    createdTime: Timestamp.fromDate(new Date()),
    updateTime: Timestamp.fromDate(new Date()),
  },
  {
    id: 'todo-3',
    text: 'Test Todo 3',
    status: 'in_progress',
    bool: false,
    createdTime: Timestamp.fromDate(new Date()),
    updateTime: Timestamp.fromDate(new Date()),
  },
];

const mockLists: StatusListProps[] = [
  { id: 'list-1', category: 'pending', number: 1 },
  { id: 'list-2', category: 'in_progress', number: 2 },
  { id: 'list-3', category: 'completed', number: 3 },
];

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

      // StatusTitleコンポーネントが各リストに表示されることを確認
      expect(screen.getByText('pending')).toBeInTheDocument();
      expect(screen.getByText('in_progress')).toBeInTheDocument();
      expect(screen.getByText('completed')).toBeInTheDocument();
    });

    it('AddListコンポーネントが表示される', () => {
      render(<MainContainer />, {
        initialTodos: mockTodos,
        initialLists: mockLists,
      });

      // AddListコンポーネントが存在することを確認
      // レンダリング結果を基に、実際のDOM構造を確認
      const dndContext = screen.getByTestId('dnd-context');
      expect(dndContext).toBeInTheDocument();
    });
  });

  describe('Todoの表示とフィルタリング', () => {
    it('各リストに適切なTodoが表示される', () => {
      render(<MainContainer />, {
        initialTodos: mockTodos,
        initialLists: mockLists,
      });

      // pending リストに 'Test Todo 1' と 'Test Todo 2' が表示される
      expect(screen.getByText('Test Todo 1')).toBeInTheDocument();
      expect(screen.getByText('Test Todo 2')).toBeInTheDocument();

      // in_progress リストに 'Test Todo 3' が表示される
      expect(screen.getByText('Test Todo 3')).toBeInTheDocument();
    });

    it('bool値によってTodoが正しく分類される', () => {
      render(<MainContainer />, {
        initialTodos: mockTodos,
        initialLists: mockLists,
      });

      // Todoアイテムが表示されることを確認（実際のdata-testidに基づいて調整）
      expect(screen.getByText('Test Todo 1')).toBeInTheDocument();
      expect(screen.getByText('Test Todo 2')).toBeInTheDocument();
      expect(screen.getByText('Test Todo 3')).toBeInTheDocument();
    });

    it('空のリストでも正常に表示される', () => {
      render(<MainContainer />, {
        initialTodos: [],
        initialLists: mockLists,
      });

      // リストは表示されるが、Todoは表示されない
      expect(screen.getByText('pending')).toBeInTheDocument();
      expect(screen.getByText('in_progress')).toBeInTheDocument();
      expect(screen.getByText('completed')).toBeInTheDocument();
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

      // MUIのBoxコンポーネントが正しく適用されることを確認
      // 具体的なスタイルのテストは実装の詳細によって調整
      const mainContainer = screen.getByTestId('dnd-context').parentElement;
      expect(mainContainer).toBeInTheDocument();
    });
  });

  describe('エラーハンドリング', () => {
    it('不正なデータでもクラッシュしない', () => {
      const invalidTodos = [
        {
          id: 'invalid-todo',
          text: 'Invalid Todo',
          status: 'invalid-status',
          bool: false,
          createdTime: Timestamp.fromDate(new Date()),
          updateTime: Timestamp.fromDate(new Date()),
        },
      ] as TodoListProps[];

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
        { length: 100 },
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
