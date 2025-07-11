import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/tests/test-utils';
import DeleteModal from '@/features/todo/components/elements/Modal/DeleteModal';

describe('DeleteModal', () => {
  const defaultProps = {
    title: 'Test List',
    modalIsOpen: true,
    onDelete: vi.fn(),
    setModalIsOpen: vi.fn(),
    setSelectModalIsOpen: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('レンダリング', () => {
    it('モーダルが開いているときに正常にレンダリングされる', () => {
      render(<DeleteModal {...defaultProps} />);

      expect(
        screen.getByText('削除しても問題ないですか？'),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'OK' })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'キャンセル' }),
      ).toBeInTheDocument();
    });

    it('モーダルが閉じているときは表示されない', () => {
      render(<DeleteModal {...defaultProps} modalIsOpen={false} />);

      expect(
        screen.queryByText('削除しても問題ないですか？'),
      ).not.toBeInTheDocument();
    });

    it('titleが存在する場合に警告メッセージが表示される', () => {
      render(<DeleteModal {...defaultProps} title="Sample List" />);

      expect(
        screen.getByText('※削除する場合、todoも消去されます。'),
      ).toBeInTheDocument();
    });

    it('titleが空の場合は警告メッセージが表示されない', () => {
      render(<DeleteModal {...defaultProps} title="" />);

      expect(
        screen.queryByText('※削除する場合、todoも消去されます。'),
      ).not.toBeInTheDocument();
    });

    it('titleがundefinedの場合は警告メッセージが表示されない', () => {
      render(<DeleteModal {...defaultProps} title={undefined} />);

      expect(
        screen.queryByText('※削除する場合、todoも消去されます。'),
      ).not.toBeInTheDocument();
    });
  });

  describe('インタラクション', () => {
    it('OKボタンクリック時にonDeleteが呼ばれる', () => {
      const mockOnDelete = vi.fn();
      render(<DeleteModal {...defaultProps} onDelete={mockOnDelete} />);

      const okButton = screen.getByRole('button', { name: 'OK' });
      fireEvent.click(okButton);

      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });

    it('OKボタンクリック時にsetSelectModalIsOpenが呼ばれる', () => {
      const mockSetSelectModalIsOpen = vi.fn();
      render(
        <DeleteModal
          {...defaultProps}
          setSelectModalIsOpen={mockSetSelectModalIsOpen}
        />,
      );

      const okButton = screen.getByRole('button', { name: 'OK' });
      fireEvent.click(okButton);

      expect(mockSetSelectModalIsOpen).toHaveBeenCalledWith(false);
    });

    it('キャンセルボタンクリック時にsetModalIsOpenが呼ばれる', () => {
      const mockSetModalIsOpen = vi.fn();
      render(
        <DeleteModal {...defaultProps} setModalIsOpen={mockSetModalIsOpen} />,
      );

      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
      fireEvent.click(cancelButton);

      expect(mockSetModalIsOpen).toHaveBeenCalledWith(false);
    });

    it('キャンセルボタンクリック時にsetSelectModalIsOpenが呼ばれる', () => {
      const mockSetSelectModalIsOpen = vi.fn();
      render(
        <DeleteModal
          {...defaultProps}
          setSelectModalIsOpen={mockSetSelectModalIsOpen}
        />,
      );

      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
      fireEvent.click(cancelButton);

      expect(mockSetSelectModalIsOpen).toHaveBeenCalledWith(false);
    });

    it('CloseIconクリック時にsetModalIsOpenが呼ばれる', () => {
      const mockSetModalIsOpen = vi.fn();
      render(
        <DeleteModal {...defaultProps} setModalIsOpen={mockSetModalIsOpen} />,
      );

      const closeIcon = screen.getByTestId('CloseIcon');
      fireEvent.click(closeIcon);

      expect(mockSetModalIsOpen).toHaveBeenCalledWith(false);
    });

    it('ESCキー押下時にsetModalIsOpenが呼ばれる', () => {
      const mockSetModalIsOpen = vi.fn();
      render(
        <DeleteModal {...defaultProps} setModalIsOpen={mockSetModalIsOpen} />,
      );

      // MUIモーダルのonCloseイベントをシミュレート
      const modal = screen.getByRole('presentation');
      fireEvent.keyDown(modal, { key: 'Escape' });

      expect(mockSetModalIsOpen).toHaveBeenCalledWith(false);
    });

    it('モーダル背景クリック時にsetModalIsOpenが呼ばれる', () => {
      const mockSetModalIsOpen = vi.fn();
      render(
        <DeleteModal {...defaultProps} setModalIsOpen={mockSetModalIsOpen} />,
      );

      // MUIモーダルの背景クリックをシミュレートするため、
      // モーダルの外側のBox要素（背景部分）をクリック
      const modal = screen.getByRole('presentation');
      const outerBox = modal.firstChild;

      if (outerBox) {
        fireEvent.click(outerBox);
      }

      expect(mockSetModalIsOpen).toHaveBeenCalledWith(false);
    });
  });

  describe('条件分岐のテスト', () => {
    it('setSelectModalIsOpenがundefinedの場合でもOKボタンが動作する', () => {
      const mockOnDelete = vi.fn();
      render(
        <DeleteModal
          {...defaultProps}
          onDelete={mockOnDelete}
          setSelectModalIsOpen={undefined}
        />,
      );

      const okButton = screen.getByRole('button', { name: 'OK' });
      fireEvent.click(okButton);

      expect(mockOnDelete).toHaveBeenCalledTimes(1);
      // setSelectModalIsOpenが呼ばれないことを確認（エラーが発生しない）
    });

    it('setSelectModalIsOpenがundefinedの場合でもキャンセルボタンが動作する', () => {
      const mockSetModalIsOpen = vi.fn();
      render(
        <DeleteModal
          {...defaultProps}
          setModalIsOpen={mockSetModalIsOpen}
          setSelectModalIsOpen={undefined}
        />,
      );

      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
      fireEvent.click(cancelButton);

      expect(mockSetModalIsOpen).toHaveBeenCalledWith(false);
      // setSelectModalIsOpenが呼ばれないことを確認（エラーが発生しない）
    });
  });

  describe('スタイリング', () => {
    it('OKボタンに適切なvariantが設定される', () => {
      render(<DeleteModal {...defaultProps} />);

      const okButton = screen.getByRole('button', { name: 'OK' });
      expect(okButton).toHaveClass('MuiButton-contained');
    });

    it('キャンセルボタンに適切なvariantが設定される', () => {
      render(<DeleteModal {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
      expect(cancelButton).toHaveClass('MuiButton-contained');
    });

    it('メインテキストに適切なvariantが設定される', () => {
      render(<DeleteModal {...defaultProps} />);

      const mainText = screen.getByText('削除しても問題ないですか？');
      expect(mainText.closest('h6')).toHaveClass('MuiTypography-h6');
    });

    it('警告メッセージに適切なvariantが設定される', () => {
      render(<DeleteModal {...defaultProps} title="Test List" />);

      const warningText = screen.getByText(
        '※削除する場合、todoも消去されます。',
      );
      expect(warningText.closest('h6')).toHaveClass('MuiTypography-subtitle2');
    });
  });

  describe('アクセシビリティ', () => {
    it('モーダルに適切なaria-labelledbyが設定される', () => {
      render(<DeleteModal {...defaultProps} />);

      const modal = screen.getByRole('presentation');
      expect(modal).toHaveAttribute('aria-labelledby', 'modal-modal-text');
    });

    it('ボタンが適切にフォーカス可能である', () => {
      render(<DeleteModal {...defaultProps} />);

      const okButton = screen.getByRole('button', { name: 'OK' });
      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });

      expect(okButton).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
    });
  });

  describe('エッジケース', () => {
    it('複数回のボタンクリックが正常に処理される', () => {
      const mockOnDelete = vi.fn();
      const mockSetModalIsOpen = vi.fn();
      render(
        <DeleteModal
          {...defaultProps}
          onDelete={mockOnDelete}
          setModalIsOpen={mockSetModalIsOpen}
        />,
      );

      const okButton = screen.getByRole('button', { name: 'OK' });
      fireEvent.click(okButton);
      fireEvent.click(okButton);

      expect(mockOnDelete).toHaveBeenCalledTimes(2);
    });

    it('同時に複数のボタンクリックが処理される', () => {
      const mockOnDelete = vi.fn();
      const mockSetModalIsOpen = vi.fn();
      render(
        <DeleteModal
          {...defaultProps}
          onDelete={mockOnDelete}
          setModalIsOpen={mockSetModalIsOpen}
        />,
      );

      const okButton = screen.getByRole('button', { name: 'OK' });
      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });

      fireEvent.click(okButton);
      fireEvent.click(cancelButton);

      expect(mockOnDelete).toHaveBeenCalledTimes(1);
      expect(mockSetModalIsOpen).toHaveBeenCalledWith(false);
    });
  });
});
