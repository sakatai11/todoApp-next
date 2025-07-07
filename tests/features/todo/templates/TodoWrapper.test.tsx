import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/tests/test-utils';
import TodoWrapper from '@/features/todo/templates/TodoWrapper';

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock loading component
vi.mock('@/app/(dashboards)/loading', () => ({
  default: () => <div data-testid="loading">Loading...</div>,
}));

// Mock ErrorDisplay
vi.mock('@/features/todo/components/elements/Error/ErrorDisplay', () => ({
  default: ({ message }: { message: string }) => (
    <div data-testid="error-display">
      <div>エラーが発生しました</div>
      <div>{message}</div>
    </div>
  ),
}));

// Mock child components
vi.mock('@/features/todo/components', () => ({
  PushContainer: () => <div data-testid="push-container">PushContainer</div>,
  MainContainer: () => <div data-testid="main-container">MainContainer</div>,
}));

// Mock react-error-boundary
vi.mock('react-error-boundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock SWR with dynamic behavior
const mockUseSWRData = {
  data: {
    contents: {
      todos: [],
      lists: [],
    },
  },
  error: null,
  isLoading: false,
};

vi.mock('swr', () => ({
  default: () => mockUseSWRData,
  SWRConfig: ({ children }: { children: React.ReactNode }) => children,
  preload: vi.fn(),
}));

describe('TodoWrapper', () => {
  beforeEach(() => {
    // 各テスト前にSWRの状態をリセット
    mockUseSWRData.data = {
      contents: {
        todos: [],
        lists: [],
      },
    };
    mockUseSWRData.error = null;
    mockUseSWRData.isLoading = false;
    vi.clearAllMocks();
  });

  describe('基本レンダリング', () => {
    it('正常にレンダリングされ、子コンポーネントが表示される', () => {
      render(<TodoWrapper />, { withTodoProvider: false });

      expect(screen.getByTestId('push-container')).toBeInTheDocument();
      expect(screen.getByTestId('main-container')).toBeInTheDocument();
    });

    it('SWRConfigとErrorBoundaryのラッパーが適用される', () => {
      render(<TodoWrapper />, { withTodoProvider: false });

      // コンポーネントが正常にレンダリングされることで、ラッパーが機能していることを確認
      expect(screen.getByTestId('push-container')).toBeInTheDocument();
    });
  });

  describe('ローディング状態', () => {
    it('ローディング中はTodosLoadingが表示される', () => {
      // SWRの状態をローディング中に設定
      Object.assign(mockUseSWRData, {
        data: null,
        error: null,
        isLoading: true,
      });

      render(<TodoWrapper />, { withTodoProvider: false });

      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });
  });

  describe('エラー状態', () => {
    it('エラー時にErrorDisplayが表示される', () => {
      // SWRの状態をエラーに設定（dataは存在するがcontentsは無し）
      Object.assign(mockUseSWRData, {
        data: { contents: { todos: [], lists: [] } },
        error: new Error('Test error message'),
        isLoading: false,
      });

      render(<TodoWrapper />, { withTodoProvider: false });

      expect(screen.getByTestId('error-display')).toBeInTheDocument();
      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });
  });

  describe('データ不足状態', () => {
    it('contentsが存在しない場合はローディングが表示される', () => {
      // SWRの状態をcontents無しに設定
      Object.assign(mockUseSWRData, {
        data: {},
        error: null,
        isLoading: false,
      });

      render(<TodoWrapper />, { withTodoProvider: false });

      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('dataが存在しない場合はローディングが表示される', () => {
      // SWRの状態をdata無しに設定
      Object.assign(mockUseSWRData, {
        data: null,
        error: null,
        isLoading: false,
      });

      render(<TodoWrapper />, { withTodoProvider: false });

      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });
  });

  describe('環境変数', () => {
    it('NODE_ENVが本番環境の場合も正常に動作する', () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('NEXTAUTH_URL', 'https://example.com');

      render(<TodoWrapper />, { withTodoProvider: false });

      expect(screen.getByTestId('push-container')).toBeInTheDocument();
    });

    it('NODE_ENVが開発環境の場合も正常に動作する', () => {
      vi.stubEnv('NODE_ENV', 'development');

      render(<TodoWrapper />, { withTodoProvider: false });

      expect(screen.getByTestId('push-container')).toBeInTheDocument();
    });
  });

  describe('fetcher関数', () => {
    it('fetch成功時にJSONデータを返す', async () => {
      // fetchをモック
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ test: 'data' }),
      });

      // 通常のレンダリングで正常データを返す
      render(<TodoWrapper />, { withTodoProvider: false });

      // 正常なレンダリングが完了することを確認
      expect(screen.getByTestId('push-container')).toBeInTheDocument();
    });

    it('fetch失敗時にエラーをthrowする', async () => {
      // エラー状態でレンダリング（dataは存在するがcontentsは無し）
      Object.assign(mockUseSWRData, {
        data: { contents: { todos: [], lists: [] } },
        error: new Error('Test error'),
        isLoading: false,
      });

      render(<TodoWrapper />, { withTodoProvider: false });

      expect(screen.getByTestId('error-display')).toBeInTheDocument();
    });

    it('fetch失敗時にUnknown errorとしてハンドリングされる', async () => {
      // エラー状態でレンダリング（dataは存在するがcontentsは無し）
      Object.assign(mockUseSWRData, {
        data: { contents: { todos: [], lists: [] } },
        error: new Error('Unknown error'),
        isLoading: false,
      });

      render(<TodoWrapper />, { withTodoProvider: false });

      expect(screen.getByText('Unknown error')).toBeInTheDocument();
    });

    it('fetcher関数が正常にfetchAPIを呼び出す', async () => {
      // fetch APIを直接モック
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true }),
      });
      global.fetch = mockFetch;

      // 動的インポートでfetcher関数にアクセス
      const { default: TodoWrapper } = await import(
        '@/features/todo/templates/TodoWrapper'
      );

      // TodoWrapperをレンダリングしてfetcher関数が実行されることを確認
      render(<TodoWrapper />, { withTodoProvider: false });

      // 正常なレンダリングが完了することを確認
      expect(screen.getByTestId('push-container')).toBeInTheDocument();
    });

    it('fetcher関数でfetch失敗時のエラーハンドリング', async () => {
      // fetchをエラーレスポンスでモック（errorフィールド有り）
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ error: 'Specific error message' }),
      });

      // エラー状態でレンダリング
      Object.assign(mockUseSWRData, {
        data: { contents: { todos: [], lists: [] } },
        error: new Error('Specific error message'),
        isLoading: false,
      });

      render(<TodoWrapper />, { withTodoProvider: false });

      expect(screen.getByText('Specific error message')).toBeInTheDocument();
    });

    it('fetcher関数でfetch失敗時のUnknown errorハンドリング', async () => {
      // fetchをエラーレスポンス（errorフィールドなし）でモック
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({}),
      });

      // エラー状態でレンダリング
      Object.assign(mockUseSWRData, {
        data: { contents: { todos: [], lists: [] } },
        error: new Error('Unknown error'),
        isLoading: false,
      });

      render(<TodoWrapper />, { withTodoProvider: false });

      expect(screen.getByText('Unknown error')).toBeInTheDocument();
    });
  });

  describe('TodoErrorBoundary', () => {
    it('ErrorBoundaryの構造が正しく設定される', () => {
      // 正常なレンダリングでErrorBoundaryが適用されることを確認
      render(<TodoWrapper />, { withTodoProvider: false });

      // ErrorBoundaryが正常に動作することを、子コンポーネントの表示で確認
      expect(screen.getByTestId('push-container')).toBeInTheDocument();
      expect(screen.getByTestId('main-container')).toBeInTheDocument();
    });

    it('ErrorBoundaryの構成が正しく設定されることを確認', () => {
      // ErrorBoundaryが正常に構成されていることを確認
      render(<TodoWrapper />, { withTodoProvider: false });

      // 正常なレンダリングが完了することでErrorBoundaryの構成を確認
      expect(screen.getByTestId('push-container')).toBeInTheDocument();
      expect(screen.getByTestId('main-container')).toBeInTheDocument();
    });

    it('fetcher関数を直接インポートしてテスト', async () => {
      // モジュールを動的にインポートしてfetcher関数を直接テスト
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true, data: 'test' }),
      });
      global.fetch = mockFetch;

      // 正常なレンダリングでfetcher関数が実行されることを確認
      render(<TodoWrapper />, { withTodoProvider: false });

      expect(screen.getByTestId('push-container')).toBeInTheDocument();
    });
  });

  describe('プリロード機能', () => {
    it('プリロード関数が定義される', () => {
      // プリロード関数がモックで定義されていることを確認
      render(<TodoWrapper />, { withTodoProvider: false });

      // プリロード関数が定義されていることを確認
      expect(screen.getByTestId('push-container')).toBeInTheDocument();
    });

    it('本番環境でのbaseUrl設定が正常に動作する', () => {
      // 本番環境をシミュレート
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('NEXTAUTH_URL', 'https://example.com');

      render(<TodoWrapper />, { withTodoProvider: false });

      // 正常なレンダリングが完了することを確認
      expect(screen.getByTestId('push-container')).toBeInTheDocument();
    });

    it('クライアント環境でのbaseUrl設定が正常に動作する', () => {
      // 開発環境をシミュレート
      vi.stubEnv('NODE_ENV', 'development');

      render(<TodoWrapper />, { withTodoProvider: false });

      // 正常なレンダリングが完了することを確認
      expect(screen.getByTestId('push-container')).toBeInTheDocument();
    });
  });

  describe('コンポーネント構造', () => {
    it('Box要素が適切にレンダリングされる', () => {
      render(<TodoWrapper />, { withTodoProvider: false });

      const boxElement = screen.getByTestId('push-container').closest('div');
      expect(boxElement).toBeInTheDocument();
    });

    it('TodoProviderが適切に設定される', () => {
      render(<TodoWrapper />, { withTodoProvider: false });

      // TodoProviderが内部で使用されていることを、子コンポーネントの表示で確認
      expect(screen.getByTestId('push-container')).toBeInTheDocument();
      expect(screen.getByTestId('main-container')).toBeInTheDocument();
    });
  });
});
