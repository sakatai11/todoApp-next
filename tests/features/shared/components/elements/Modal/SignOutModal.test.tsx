import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/tests/test-utils';
import SignOutModal from '@/features/shared/components/elements/Modal/SignOutModal';

// onSignOut後のredirectは副作用のためモック化
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

describe('SignOutModal', () => {
  const defaultProps = {
    modalIsOpen: true,
    setModalIsOpen: vi.fn(),
    onSignOut: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('レンダリング', () => {
    it('モーダルが開いているときに正常にレンダリングされる', () => {
      render(<SignOutModal {...defaultProps} />);

      expect(screen.getByText('サインアウトしますか？')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'はい' })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'いいえ' }),
      ).toBeInTheDocument();
    });
  });

  describe('インタラクション', () => {
    it('閉じるボタンにアクセシブルネームが付与され、クリックでモーダルが閉じる', () => {
      const mockSetModalIsOpen = vi.fn();
      render(
        <SignOutModal {...defaultProps} setModalIsOpen={mockSetModalIsOpen} />,
      );

      // 閉じるボタンはアクセシブルネームを持つ<button>として到達可能
      const closeButton = screen.getByRole('button', { name: '閉じる' });
      fireEvent.click(closeButton);

      expect(mockSetModalIsOpen).toHaveBeenCalledWith(false);
    });

    it('いいえボタンクリックでモーダルが閉じる', () => {
      const mockSetModalIsOpen = vi.fn();
      render(
        <SignOutModal {...defaultProps} setModalIsOpen={mockSetModalIsOpen} />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'いいえ' }));

      expect(mockSetModalIsOpen).toHaveBeenCalledWith(false);
    });

    it('はいボタンクリックでonSignOutが呼ばれる', () => {
      const mockOnSignOut = vi.fn();
      render(<SignOutModal {...defaultProps} onSignOut={mockOnSignOut} />);

      fireEvent.click(screen.getByRole('button', { name: 'はい' }));

      expect(mockOnSignOut).toHaveBeenCalled();
    });
  });
});
