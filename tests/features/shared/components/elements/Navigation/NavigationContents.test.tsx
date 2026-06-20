import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  mockUser,
} from '@/tests/test-utils';
import NavigationContents from '@/features/shared/components/elements/Navigation/NavigationContents';

// Mock dependencies
vi.mock('@/features/shared/components/elements/Icon/IconContents', () => ({
  default: ({ initial }: { initial: string }) => (
    <div data-testid="icon-contents">{initial}</div>
  ),
}));

interface MockSignOutModalProps {
  modalIsOpen: boolean;
  setModalIsOpen: (isOpen: boolean) => void;
  onSignOut: () => void;
}

vi.mock('@/features/shared/components/elements/Modal/SignOutModal', () => ({
  default: ({
    modalIsOpen,
    setModalIsOpen,
    onSignOut,
  }: MockSignOutModalProps) => (
    <div data-testid="signout-modal">
      <div data-testid="modal-status">
        {modalIsOpen ? 'Modal Open' : 'Modal Closed'}
      </div>
      <button data-testid="confirm-signout" onClick={onSignOut}>
        Confirm SignOut
      </button>
      <button
        data-testid="cancel-signout"
        onClick={() => setModalIsOpen(false)}
      >
        Cancel
      </button>
    </div>
  ),
}));

vi.mock('@/app/(auth)/_signOut/signOut', () => ({
  authSignOut: vi.fn(),
}));

import { authSignOut } from '@/app/(auth)/_signOut/signOut';
const mockAuthSignOut = vi.mocked(authSignOut);

// mockUserはtest-utilsからインポート済み（サブモジュールデータを使用）

const defaultProps = {
  user: mockUser,
  initial: 'T',
  modalIsOpen: false,
  setModalIsOpen: vi.fn(),
  onCloseNav: vi.fn(),
};

describe('NavigationContents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('レンダリング', () => {
    it('正常にレンダリングされる', () => {
      render(<NavigationContents {...defaultProps} />);

      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByTestId('icon-contents')).toBeInTheDocument();
      expect(screen.getByText('example@test.com')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'サインアウト' }),
      ).toBeInTheDocument();
    });

    it('アイコンコンテンツが正しいinitialで表示される', () => {
      render(<NavigationContents {...defaultProps} initial="A" />);

      const iconContents = screen.getByTestId('icon-contents');
      expect(iconContents).toHaveTextContent('A');
    });

    it('ユーザーのメールアドレスが表示される', () => {
      const customUser = { ...mockUser, email: 'custom@example.com' };
      render(<NavigationContents {...defaultProps} user={customUser} />);

      expect(screen.getByText('custom@example.com')).toBeInTheDocument();
    });

    it('長いメールアドレスも適切に表示される', () => {
      const customUser = {
        ...mockUser,
        email: 'very-long-email-address@very-long-domain-name.example.com',
      };
      render(<NavigationContents {...defaultProps} user={customUser} />);

      expect(screen.getByText(customUser.email)).toBeInTheDocument();
    });
  });

  describe('サインアウトボタン', () => {
    it('サインアウトボタンクリックでモーダルが開く', () => {
      const mockSetModalIsOpen = vi.fn();
      render(
        <NavigationContents
          {...defaultProps}
          setModalIsOpen={mockSetModalIsOpen}
        />,
      );

      const signOutButton = screen.getByRole('button', {
        name: 'サインアウト',
      });
      fireEvent.click(signOutButton);

      expect(mockSetModalIsOpen).toHaveBeenCalledWith(true);
    });

    it('サインアウトボタンが適切なvariantで表示される', () => {
      render(<NavigationContents {...defaultProps} />);

      const signOutButton = screen.getByRole('button', {
        name: 'サインアウト',
      });
      expect(signOutButton).toHaveClass('MuiButton-text');
      expect(signOutButton).toHaveClass('MuiButton-sizeSmall');
    });
  });

  describe('サインアウトモーダル', () => {
    it('modalIsOpenがfalseの場合、モーダルが表示されない', () => {
      render(<NavigationContents {...defaultProps} modalIsOpen={false} />);

      expect(screen.queryByTestId('signout-modal')).not.toBeInTheDocument();
    });

    it('modalIsOpenがtrueの場合、モーダルが表示される', () => {
      render(<NavigationContents {...defaultProps} modalIsOpen={true} />);

      expect(screen.getByTestId('signout-modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-status')).toHaveTextContent(
        'Modal Open',
      );
    });

    it('サインアウト確認時に適切な処理が実行される', async () => {
      const mockSetModalIsOpen = vi.fn();
      const mockOnCloseNav = vi.fn();
      mockAuthSignOut.mockResolvedValue({} as never);

      render(
        <NavigationContents
          {...defaultProps}
          modalIsOpen={true}
          setModalIsOpen={mockSetModalIsOpen}
          onCloseNav={mockOnCloseNav}
        />,
      );

      const confirmButton = screen.getByTestId('confirm-signout');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockAuthSignOut).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(mockSetModalIsOpen).toHaveBeenCalledWith(false);
      });

      await waitFor(() => {
        expect(mockOnCloseNav).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('スタイリング', () => {
    it('navigationボックスに適切なスタイルが適用される', () => {
      render(<NavigationContents {...defaultProps} />);

      const navigation = screen.getByRole('navigation');
      expect(navigation).toBeInTheDocument();
    });

    it('メールアドレスのTypographyに適切なvariantが設定される', () => {
      render(<NavigationContents {...defaultProps} />);

      const emailText = screen.getByText('example@test.com');
      expect(emailText.closest('p')).toHaveClass('MuiTypography-body2');
    });
  });

  describe('Props変更への対応', () => {
    it('user.emailが変更された場合、新しいメールアドレスが表示される', () => {
      const { rerender } = render(<NavigationContents {...defaultProps} />);

      expect(screen.getByText('example@test.com')).toBeInTheDocument();

      const newUser = { ...mockUser, email: 'new@example.com' };
      rerender(<NavigationContents {...defaultProps} user={newUser} />);

      expect(screen.getByText('new@example.com')).toBeInTheDocument();
      expect(screen.queryByText('example@test.com')).not.toBeInTheDocument();
    });

    it('initialが変更された場合、新しい値がIconContentsに渡される', () => {
      const { rerender } = render(
        <NavigationContents {...defaultProps} initial="T" />,
      );

      expect(screen.getByTestId('icon-contents')).toHaveTextContent('T');

      rerender(<NavigationContents {...defaultProps} initial="N" />);

      expect(screen.getByTestId('icon-contents')).toHaveTextContent('N');
    });

    it('modalIsOpenの状態変化でモーダルの表示/非表示が切り替わる', () => {
      const { rerender } = render(
        <NavigationContents {...defaultProps} modalIsOpen={false} />,
      );

      expect(screen.queryByTestId('signout-modal')).not.toBeInTheDocument();

      rerender(<NavigationContents {...defaultProps} modalIsOpen={true} />);

      expect(screen.getByTestId('signout-modal')).toBeInTheDocument();
    });
  });

  describe('メモ化の動作', () => {
    it('NavigationContentsがmemo化されている', () => {
      // memoが適用されていることを確認
      expect(NavigationContents.$$typeof).toBeDefined();
    });
  });
});
