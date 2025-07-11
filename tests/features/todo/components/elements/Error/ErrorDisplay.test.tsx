import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/tests/test-utils';
import ErrorDisplay from '@/features/todo/components/elements/Error/ErrorDisplay';

// window.location.reload をモック
const mockReload = vi.fn();
Object.defineProperty(window, 'location', {
  value: {
    reload: mockReload,
  },
  writable: true,
});

describe('ErrorDisplay', () => {
  const defaultProps = {
    message: 'テストエラーメッセージ',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('レンダリング', () => {
    it('正常にレンダリングされる', () => {
      render(<ErrorDisplay {...defaultProps} />);

      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
      expect(screen.getByText(defaultProps.message)).toBeInTheDocument();
      expect(screen.getByText('再読み込み')).toBeInTheDocument();
    });

    it('ErrorIconが表示される', () => {
      render(<ErrorDisplay {...defaultProps} />);

      const errorIcon = screen.getByLabelText('errorIcon');
      // ErrorIconのSVG要素を確認
      expect(errorIcon).toBeInTheDocument();
    });

    it('カスタムメッセージが正しく表示される', () => {
      const customMessage = 'カスタムエラーメッセージ';
      render(<ErrorDisplay message={customMessage} />);

      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });
  });

  describe('再読み込み機能', () => {
    it('onRetryが提供されていない場合、window.location.reloadが呼ばれる', () => {
      render(<ErrorDisplay {...defaultProps} />);

      const retryButton = screen.getByText('再読み込み');
      fireEvent.click(retryButton);

      expect(mockReload).toHaveBeenCalledTimes(1);
    });

    it('onRetryが提供されている場合、そのコールバックが呼ばれる', () => {
      const mockOnRetry = vi.fn();
      render(<ErrorDisplay {...defaultProps} onRetry={mockOnRetry} />);

      const retryButton = screen.getByText('再読み込み');
      fireEvent.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalledTimes(1);
      expect(mockReload).not.toHaveBeenCalled();
    });

    it('複数回クリックした場合、それぞれ正常に処理される', () => {
      const mockOnRetry = vi.fn();
      render(<ErrorDisplay {...defaultProps} onRetry={mockOnRetry} />);

      const retryButton = screen.getByText('再読み込み');
      fireEvent.click(retryButton);
      fireEvent.click(retryButton);
      fireEvent.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalledTimes(3);
    });
  });

  describe('条件分岐のテスト', () => {
    it('onRetryがundefinedの場合、デフォルトの動作が実行される', () => {
      render(<ErrorDisplay {...defaultProps} onRetry={undefined} />);

      const retryButton = screen.getByText('再読み込み');
      fireEvent.click(retryButton);

      expect(mockReload).toHaveBeenCalledTimes(1);
    });

    it('onRetryが関数の場合、その関数が実行される', () => {
      const mockOnRetry = vi.fn();
      render(<ErrorDisplay {...defaultProps} onRetry={mockOnRetry} />);

      const retryButton = screen.getByText('再読み込み');
      fireEvent.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalledTimes(1);
      expect(mockReload).not.toHaveBeenCalled();
    });
  });

  describe('スタイリング', () => {
    it('Box要素が適切にレンダリングされる', () => {
      render(<ErrorDisplay {...defaultProps} />);

      const boxElement = screen.getByText(defaultProps.message).closest('div');
      expect(boxElement).toBeInTheDocument();
    });

    it('Paper要素が適切にレンダリングされる', () => {
      render(<ErrorDisplay {...defaultProps} />);

      // ErrorIconを含むPaper要素を確認
      const errorIcon = screen.getByTestId('ErrorIcon');
      const paperElement = errorIcon.closest('div[class*="MuiPaper"]');
      expect(paperElement).toBeInTheDocument();
    });

    it('Button要素が適切にレンダリングされる', () => {
      render(<ErrorDisplay {...defaultProps} />);

      const button = screen.getByRole('button', { name: '再読み込み' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('MuiButton-root');
    });
  });

  describe('エッジケース', () => {
    it('空のメッセージでもレンダリングされる', () => {
      render(<ErrorDisplay message="" />);

      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
      expect(screen.getByText('再読み込み')).toBeInTheDocument();
    });

    it('非常に長いメッセージでもレンダリングされる', () => {
      const longMessage = 'A'.repeat(1000);
      render(<ErrorDisplay message={longMessage} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('特殊文字を含むメッセージでもレンダリングされる', () => {
      const specialMessage = '特殊文字: @#$%^&*()_+{}|:<>?[]\\;\'",./`~';
      render(<ErrorDisplay message={specialMessage} />);

      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });
  });
});
