import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ErrorSnackbar } from '@/features/todo/components/elements/Error/ErrorSnackbar';
import { ErrorProvider, useError } from '@/features/todo/contexts/ErrorContext';

// Mock useRouter
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Wrapper component for testing
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return <ErrorProvider>{children}</ErrorProvider>;
};

// Helper component to trigger error
const ErrorTrigger = ({ message }: { message: string }) => {
  const { showError } = useError();
  React.useEffect(() => {
    showError(message);
  }, [message, showError]);
  return null;
};

describe('ErrorSnackbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('レンダリング', () => {
    it('エラーがない場合はエラーメッセージが表示されない', () => {
      render(
        <TestWrapper>
          <ErrorSnackbar />
        </TestWrapper>,
      );

      // エラーメッセージが表示されていない
      expect(screen.queryByText('トップへ戻る')).not.toBeInTheDocument();
    });

    it('エラーがある場合はSnackbarが正常に表示される', () => {
      const errorMessage = 'テストエラーメッセージ';
      render(
        <TestWrapper>
          <ErrorTrigger message={errorMessage} />
          <ErrorSnackbar />
        </TestWrapper>,
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('エラーメッセージが正常に表示される', () => {
      const errorMessage = 'カスタムエラーメッセージ';
      render(
        <TestWrapper>
          <ErrorTrigger message={errorMessage} />
          <ErrorSnackbar />
        </TestWrapper>,
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('「トップへ戻る」ボタンが正常に表示される', () => {
      render(
        <TestWrapper>
          <ErrorTrigger message="エラーメッセージ" />
          <ErrorSnackbar />
        </TestWrapper>,
      );

      expect(screen.getByText('トップへ戻る')).toBeInTheDocument();
    });
  });

  describe('インタラクション', () => {
    it('「トップへ戻る」ボタンをクリックするとエラーが正常にクリアされる', async () => {
      render(
        <TestWrapper>
          <ErrorTrigger message="エラーメッセージ" />
          <ErrorSnackbar />
        </TestWrapper>,
      );

      const button = screen.getByText('トップへ戻る');

      await act(async () => {
        fireEvent.click(button);
      });

      // エラーがクリアされたことを確認（エラーメッセージが表示されなくなる）
      expect(screen.queryByText('エラーメッセージ')).not.toBeInTheDocument();
    });

    it('「トップへ戻る」ボタンをクリックするとルーターが正常にトップページに遷移する', async () => {
      render(
        <TestWrapper>
          <ErrorTrigger message="エラーメッセージ" />
          <ErrorSnackbar />
        </TestWrapper>,
      );

      const button = screen.getByText('トップへ戻る');

      await act(async () => {
        fireEvent.click(button);
      });

      expect(mockPush).toHaveBeenCalledWith('/');
      expect(mockPush).toHaveBeenCalledTimes(1);
    });

    it('ボタンクリック時にエラークリアとルーター遷移が正常に実行される', async () => {
      render(
        <TestWrapper>
          <ErrorTrigger message="エラーメッセージ" />
          <ErrorSnackbar />
        </TestWrapper>,
      );

      const button = screen.getByText('トップへ戻る');

      await act(async () => {
        fireEvent.click(button);
      });

      // エラーがクリアされる
      expect(screen.queryByText('エラーメッセージ')).not.toBeInTheDocument();
      // ルーター遷移が実行される
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  describe('UIスタイリング', () => {
    it('Alert severityが"error"である', () => {
      const { container } = render(
        <TestWrapper>
          <ErrorTrigger message="エラーメッセージ" />
          <ErrorSnackbar />
        </TestWrapper>,
      );

      const alert = container.querySelector('.MuiAlert-standardError');
      expect(alert).toBeInTheDocument();
    });

    it('Snackbarの位置が正常に設定される（bottom center）', () => {
      const { container } = render(
        <TestWrapper>
          <ErrorTrigger message="エラーメッセージ" />
          <ErrorSnackbar />
        </TestWrapper>,
      );

      const snackbar = container.querySelector(
        '.MuiSnackbar-anchorOriginBottomCenter',
      );
      expect(snackbar).toBeInTheDocument();
    });
  });

  describe('エッジケース', () => {
    it('空文字列のエラーではエラーメッセージが表示されない', () => {
      render(
        <TestWrapper>
          <ErrorTrigger message="" />
          <ErrorSnackbar />
        </TestWrapper>,
      );

      // エラーが空文字列の場合、!!errorはfalseになるためボタンが表示されない
      expect(screen.queryByText('トップへ戻る')).not.toBeInTheDocument();
    });

    it('長いエラーメッセージも正常に表示される', () => {
      const longErrorMessage = 'これは非常に長いエラーメッセージです。'.repeat(
        10,
      );
      render(
        <TestWrapper>
          <ErrorTrigger message={longErrorMessage} />
          <ErrorSnackbar />
        </TestWrapper>,
      );

      expect(screen.getByText(longErrorMessage)).toBeInTheDocument();
    });
  });

  describe('複数のエラー', () => {
    it('後から表示されたエラーが正常に優先される', () => {
      // 固定のwrapper関数を定義して同一コンテキストを維持
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ErrorProvider>{children}</ErrorProvider>
      );

      const { rerender } = render(
        <>
          <ErrorTrigger message="最初のエラー" />
          <ErrorSnackbar />
        </>,
        { wrapper },
      );

      expect(screen.getByText('最初のエラー')).toBeInTheDocument();

      // 同じwrapperを使用してrerenderし、同一コンテキスト内での検証
      rerender(
        <>
          <ErrorTrigger message="2番目のエラー" />
          <ErrorSnackbar />
        </>,
      );

      expect(screen.getByText('2番目のエラー')).toBeInTheDocument();
      expect(screen.queryByText('最初のエラー')).not.toBeInTheDocument();
    });
  });
});
