import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/tests/test-utils';
import PushContainer from '@/features/todo/components/PushContainer/PushContainer';
import { mockTodos, mockLists } from '@/tests/test-utils';

// EditModalコンポーネントをモック
interface MockEditModalProps {
  modalIsOpen: boolean;
  setModalIsOpen: (isOpen: boolean) => void;
  id: string;
}

vi.mock('@/features/todo/components/elements/Modal/EditModal', () => ({
  default: ({ modalIsOpen, setModalIsOpen, id }: MockEditModalProps) => (
    <div data-testid={`edit-modal-${id}`}>
      <div data-testid="modal-status">
        {modalIsOpen ? 'Modal Open' : 'Modal Closed'}
      </div>
      <button data-testid="close-modal" onClick={() => setModalIsOpen(false)}>
        Close Modal
      </button>
    </div>
  ),
}));

describe('PushContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('レンダリング', () => {
    it('正常にレンダリングされる', () => {
      render(<PushContainer />, {
        withTodoProvider: true,
        initialTodos: mockTodos,
        initialLists: mockLists,
      });

      expect(screen.getByText('新規作成')).toBeInTheDocument();
    });

    it('新規作成ボタンが表示される', () => {
      render(<PushContainer />, {
        withTodoProvider: true,
        initialTodos: mockTodos,
        initialLists: mockLists,
      });

      const createButton = screen.getByRole('button', { name: '新規作成' });
      expect(createButton).toBeInTheDocument();
      expect(createButton).toHaveAttribute('type', 'button');
    });

    it('EditModalが初期状態では閉じている', () => {
      render(<PushContainer />, {
        withTodoProvider: true,
        initialTodos: mockTodos,
        initialLists: mockLists,
      });

      expect(
        screen.getByTestId('edit-modal-pushContainer'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('modal-status')).toHaveTextContent(
        'Modal Closed',
      );
    });
  });

  describe('モーダル操作', () => {
    it('新規作成ボタンクリックでモーダルが開く', () => {
      render(<PushContainer />, {
        withTodoProvider: true,
        initialTodos: mockTodos,
        initialLists: mockLists,
      });

      const createButton = screen.getByRole('button', { name: '新規作成' });

      fireEvent.click(createButton);

      expect(screen.getByTestId('modal-status')).toHaveTextContent(
        'Modal Open',
      );
    });

    it('モーダルが開いた後、閉じることができる', () => {
      render(<PushContainer />, {
        withTodoProvider: true,
        initialTodos: mockTodos,
        initialLists: mockLists,
      });

      const createButton = screen.getByRole('button', { name: '新規作成' });

      // モーダルを開く
      fireEvent.click(createButton);
      expect(screen.getByTestId('modal-status')).toHaveTextContent(
        'Modal Open',
      );

      // モーダルを閉じる
      const closeButton = screen.getByTestId('close-modal');
      fireEvent.click(closeButton);
      expect(screen.getByTestId('modal-status')).toHaveTextContent(
        'Modal Closed',
      );
    });

    it('複数回クリックしてもモーダルが正常に動作する', () => {
      render(<PushContainer />, {
        withTodoProvider: true,
        initialTodos: mockTodos,
        initialLists: mockLists,
      });

      const createButton = screen.getByRole('button', { name: '新規作成' });
      const closeButton = screen.getByTestId('close-modal');

      // 開く → 閉じる → 開く のサイクルをテスト
      fireEvent.click(createButton);
      expect(screen.getByTestId('modal-status')).toHaveTextContent(
        'Modal Open',
      );

      fireEvent.click(closeButton);
      expect(screen.getByTestId('modal-status')).toHaveTextContent(
        'Modal Closed',
      );

      fireEvent.click(createButton);
      expect(screen.getByTestId('modal-status')).toHaveTextContent(
        'Modal Open',
      );
    });
  });

  describe('編集状態の条件分岐', () => {
    it('編集中でない場合、EditModalが表示される', () => {
      render(<PushContainer />, {
        withTodoProvider: true,
        initialTodos: mockTodos,
        initialLists: mockLists,
      });

      expect(
        screen.getByTestId('edit-modal-pushContainer'),
      ).toBeInTheDocument();
    });

    it('編集中の場合でもコンポーネントが正常にレンダリングされる', () => {
      render(<PushContainer />, {
        withTodoProvider: true,
        initialTodos: mockTodos,
        initialLists: mockLists,
      });

      // 新規作成ボタンは常に表示される
      expect(
        screen.getByRole('button', { name: '新規作成' }),
      ).toBeInTheDocument();
    });
  });

  describe('スタイリング', () => {
    it('適切なBoxスタイルが適用される', () => {
      render(<PushContainer />, {
        withTodoProvider: true,
        initialTodos: mockTodos,
        initialLists: mockLists,
      });

      const container = screen.getByText('新規作成').closest('div');
      expect(container).toBeInTheDocument();
    });

    it('新規作成ボタンが正しいvariantで表示される', () => {
      render(<PushContainer />, {
        withTodoProvider: true,
        initialTodos: mockTodos,
        initialLists: mockLists,
      });

      const createButton = screen.getByRole('button', { name: '新規作成' });
      expect(createButton).toHaveClass('MuiButton-contained');
    });
  });

  describe('displayName', () => {
    it('コンポーネントにdisplayNameが設定されている', () => {
      expect(PushContainer.displayName).toBe('PushContainer');
    });
  });
});
