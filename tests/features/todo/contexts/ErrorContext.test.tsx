import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ErrorProvider, useError } from '@/features/todo/contexts/ErrorContext';

// Wrapper component for hooks testing
const createWrapper = () => {
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <ErrorProvider>{children}</ErrorProvider>
  );
  TestWrapper.displayName = 'TestWrapper';
  return TestWrapper;
};

describe('ErrorContext', () => {
  describe('Context Provider', () => {
    it('初期状態でエラーがnullである', () => {
      const { result } = renderHook(() => useError(), {
        wrapper: createWrapper(),
      });

      expect(result.current.error).toBeNull();
    });

    it('showErrorでエラーメッセージが正常に設定される', () => {
      const { result } = renderHook(() => useError(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.showError('テストエラーメッセージ');
      });

      expect(result.current.error).toBe('テストエラーメッセージ');
    });

    it('clearErrorでエラーメッセージが正常にクリアされる', () => {
      const { result } = renderHook(() => useError(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.showError('テストエラーメッセージ');
      });

      expect(result.current.error).toBe('テストエラーメッセージ');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('複数回showErrorを呼び出すと最後のエラーメッセージが保持される', () => {
      const { result } = renderHook(() => useError(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.showError('最初のエラー');
      });

      expect(result.current.error).toBe('最初のエラー');

      act(() => {
        result.current.showError('2番目のエラー');
      });

      expect(result.current.error).toBe('2番目のエラー');
    });

    it('必要な関数がすべて利用可能である', () => {
      const { result } = renderHook(() => useError(), {
        wrapper: createWrapper(),
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.showError).toBeDefined();
      expect(result.current.clearError).toBeDefined();
      expect(typeof result.current.showError).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });
  });

  describe('Context Error Handling', () => {
    it('プロバイダー外でのコンテキスト使用時にエラーがスローされる', () => {
      // コンソールエラーを抑制
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useError());
      }).toThrow('useError must be used within ErrorProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('関数の安定性', () => {
    it('showError関数が再レンダリング時に同一参照を保持する', () => {
      const { result, rerender } = renderHook(() => useError(), {
        wrapper: createWrapper(),
      });

      const firstShowError = result.current.showError;

      rerender();

      expect(result.current.showError).toBe(firstShowError);
    });

    it('clearError関数が再レンダリング時に同一参照を保持する', () => {
      const { result, rerender } = renderHook(() => useError(), {
        wrapper: createWrapper(),
      });

      const firstClearError = result.current.clearError;

      rerender();

      expect(result.current.clearError).toBe(firstClearError);
    });
  });
});
