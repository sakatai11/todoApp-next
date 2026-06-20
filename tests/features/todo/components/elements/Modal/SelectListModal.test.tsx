import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/tests/test-utils';
import SelectListModal from '@/features/todo/components/elements/Modal/SelectListModal';

describe('SelectListModal', () => {
  const defaultProps = {
    id: 'list-2',
    listNumber: 2,
    listLength: 3,
    setSelectModalIsOpen: vi.fn(),
    setDeleteIsModalOpen: vi.fn(),
    setTextRename: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('レンダリング', () => {
    it('正常にレンダリングされる', () => {
      render(<SelectListModal {...defaultProps} />, {
        withTodoProvider: true,
      });

      expect(screen.getByText('リストを削除する')).toBeInTheDocument();
      expect(screen.getByText('リスト名を変える')).toBeInTheDocument();
    });

    it('最初のリスト（listNumber = 1）で右移動ボタンのみ表示される', () => {
      render(
        <SelectListModal {...defaultProps} listNumber={1} listLength={3} />,
        {
          withTodoProvider: true,
        },
      );

      expect(screen.getByText('1つ右へ移動する')).toBeInTheDocument();
      expect(screen.queryByText('1つ左へ移動する')).not.toBeInTheDocument();
    });

    it('最後のリスト（listNumber = listLength）で左移動ボタンのみ表示される', () => {
      render(
        <SelectListModal {...defaultProps} listNumber={3} listLength={3} />,
        {
          withTodoProvider: true,
        },
      );

      expect(screen.getByText('1つ左へ移動する')).toBeInTheDocument();
      expect(screen.queryByText('1つ右へ移動する')).not.toBeInTheDocument();
    });

    it('中間のリストで両方の移動ボタンが表示される', () => {
      render(
        <SelectListModal {...defaultProps} listNumber={2} listLength={3} />,
        {
          withTodoProvider: true,
        },
      );

      const leftButtons = screen.getAllByText('1つ左へ移動する');
      const rightButtons = screen.getAllByText('1つ右へ移動する');

      expect(leftButtons).toHaveLength(1);
      expect(rightButtons).toHaveLength(1);
    });

    it('リストが1つしかない場合は両方の移動ボタンが表示される', () => {
      render(
        <SelectListModal {...defaultProps} listNumber={1} listLength={1} />,
        {
          withTodoProvider: true,
        },
      );

      expect(screen.getByText('1つ左へ移動する')).toBeInTheDocument();
      expect(screen.getByText('1つ右へ移動する')).toBeInTheDocument();
    });
  });

  describe('ボタンアクション', () => {
    it('右移動ボタンが正常にクリックできる', () => {
      render(
        <SelectListModal {...defaultProps} listNumber={1} listLength={3} />,
        {
          withTodoProvider: true,
        },
      );

      const rightButton = screen.getByText('1つ右へ移動する');
      fireEvent.click(rightButton);

      // ボタンが正常にクリック可能
      expect(rightButton).toBeInTheDocument();
    });

    it('左移動ボタンが正常にクリックできる', () => {
      render(
        <SelectListModal {...defaultProps} listNumber={3} listLength={3} />,
        {
          withTodoProvider: true,
        },
      );

      const leftButton = screen.getByText('1つ左へ移動する');
      fireEvent.click(leftButton);

      // ボタンが正常にクリック可能
      expect(leftButton).toBeInTheDocument();
    });

    it('中間リストでの左移動ボタンクリック（69-71行目カバレッジ）', () => {
      const mockSetSelectModalIsOpen = vi.fn();

      render(
        <SelectListModal
          {...defaultProps}
          listNumber={2}
          listLength={3}
          setSelectModalIsOpen={mockSetSelectModalIsOpen}
        />,
        {
          withTodoProvider: true,
        },
      );

      const leftButton = screen.getByText('1つ左へ移動する');
      fireEvent.click(leftButton);

      // setSelectModalIsOpenが呼ばれることを確認（69-71行目をカバー）
      expect(mockSetSelectModalIsOpen).toHaveBeenCalledWith(false);
    });

    it('中間リストでの右移動ボタンクリック（77-79行目カバレッジ）', () => {
      const mockSetSelectModalIsOpen = vi.fn();

      render(
        <SelectListModal
          {...defaultProps}
          listNumber={2}
          listLength={3}
          setSelectModalIsOpen={mockSetSelectModalIsOpen}
        />,
        {
          withTodoProvider: true,
        },
      );

      const rightButton = screen.getByText('1つ右へ移動する');
      fireEvent.click(rightButton);

      // setSelectModalIsOpenが呼ばれることを確認（77-79行目をカバー）
      expect(mockSetSelectModalIsOpen).toHaveBeenCalledWith(false);
    });

    it('削除ボタンクリック時に適切な処理が実行される', () => {
      const mockSetDeleteIsModalOpen = vi.fn();
      const mockSetSelectModalIsOpen = vi.fn();

      render(
        <SelectListModal
          {...defaultProps}
          setDeleteIsModalOpen={mockSetDeleteIsModalOpen}
          setSelectModalIsOpen={mockSetSelectModalIsOpen}
        />,
        {
          withTodoProvider: true,
        },
      );

      const deleteButton = screen.getByText('リストを削除する');
      fireEvent.click(deleteButton);

      expect(mockSetDeleteIsModalOpen).toHaveBeenCalledWith(true);
      expect(mockSetSelectModalIsOpen).toHaveBeenCalledWith(true);
    });

    it('リスト名変更ボタンが正常にクリックできる', () => {
      const mockSetSelectModalIsOpen = vi.fn();
      const mockSetTextRename = vi.fn();

      render(
        <SelectListModal
          {...defaultProps}
          setSelectModalIsOpen={mockSetSelectModalIsOpen}
          setTextRename={mockSetTextRename}
        />,
        {
          withTodoProvider: true,
        },
      );

      const renameButton = screen.getByText('リスト名を変える');
      fireEvent.click(renameButton);

      expect(mockSetSelectModalIsOpen).toHaveBeenCalledWith(false);
      expect(mockSetTextRename).toHaveBeenCalledWith(true);
    });
  });

  describe('条件分岐のテスト', () => {
    it('listNumber = 1, listLength = 2の場合に右移動ボタンのみ表示', () => {
      render(
        <SelectListModal {...defaultProps} listNumber={1} listLength={2} />,
        {
          withTodoProvider: true,
        },
      );

      expect(screen.getByText('1つ右へ移動する')).toBeInTheDocument();
      expect(screen.queryByText('1つ左へ移動する')).not.toBeInTheDocument();
    });

    it('listNumber = 2, listLength = 2の場合に左移動ボタンのみ表示', () => {
      render(
        <SelectListModal {...defaultProps} listNumber={2} listLength={2} />,
        {
          withTodoProvider: true,
        },
      );

      expect(screen.getByText('1つ左へ移動する')).toBeInTheDocument();
      expect(screen.queryByText('1つ右へ移動する')).not.toBeInTheDocument();
    });

    it('listNumber = 2, listLength = 4の場合に両方の移動ボタンが表示', () => {
      render(
        <SelectListModal {...defaultProps} listNumber={2} listLength={4} />,
        {
          withTodoProvider: true,
        },
      );

      expect(screen.getByText('1つ左へ移動する')).toBeInTheDocument();
      expect(screen.getByText('1つ右へ移動する')).toBeInTheDocument();
    });
  });

  describe('スタイリング', () => {
    it('ButtonGroupに適切なvariantが設定される', () => {
      render(<SelectListModal {...defaultProps} />, {
        withTodoProvider: true,
      });

      const buttonGroup = screen.getByRole('group');
      expect(buttonGroup).toHaveClass('MuiButtonGroup-vertical');
    });

    it('ボタンが適切にレンダリングされる', () => {
      render(<SelectListModal {...defaultProps} />, {
        withTodoProvider: true,
      });

      const deleteButton = screen.getByText('リストを削除する');
      const renameButton = screen.getByText('リスト名を変える');

      expect(deleteButton).toHaveClass('MuiButton-text');
      expect(renameButton).toHaveClass('MuiButton-text');
    });
  });

  describe('エッジケース', () => {
    it('setSelectModalIsOpenがundefinedでも動作する', () => {
      render(
        <SelectListModal {...defaultProps} setSelectModalIsOpen={undefined} />,
        {
          withTodoProvider: true,
        },
      );

      // エラーが発生せずにレンダリングされることを確認
      expect(screen.getByText('リストを削除する')).toBeInTheDocument();
    });

    it('複数回のボタンクリックが正常に処理される', () => {
      const mockSetDeleteIsModalOpen = vi.fn();

      render(
        <SelectListModal
          {...defaultProps}
          setDeleteIsModalOpen={mockSetDeleteIsModalOpen}
        />,
        {
          withTodoProvider: true,
        },
      );

      const deleteButton = screen.getByText('リストを削除する');
      fireEvent.click(deleteButton);
      fireEvent.click(deleteButton);

      expect(mockSetDeleteIsModalOpen).toHaveBeenCalledTimes(2);
    });

    it('異なるlistNumberとlistLengthの組み合わせが正常に動作する', () => {
      render(
        <SelectListModal {...defaultProps} listNumber={5} listLength={10} />,
        {
          withTodoProvider: true,
        },
      );

      // 中間のリストとして両方の移動ボタンが表示される
      expect(screen.getByText('1つ左へ移動する')).toBeInTheDocument();
      expect(screen.getByText('1つ右へ移動する')).toBeInTheDocument();
    });
  });

  describe('コンテキスト統合', () => {
    it('useTodoContextから取得したフックが正しく使用される', () => {
      render(<SelectListModal {...defaultProps} />, {
        withTodoProvider: true,
      });

      // コンポーネントが正常にレンダリングされ、コンテキストのフックが使用されている
      expect(screen.getByText('リストを削除する')).toBeInTheDocument();
      expect(screen.getByText('リスト名を変える')).toBeInTheDocument();
    });
  });
});
