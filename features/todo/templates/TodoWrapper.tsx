'use client';

import { TodoListProps } from '@/types/todos';
import { StatusListProps } from '@/types/lists';
import { Box } from '@mui/material';
import { PushContainer, MainContainer } from '@/features/todo/components';
import { TodoProvider } from '@/features/todo/contexts/TodoContext';
import useSWR, { SWRConfig, preload } from 'swr';
import TodosLoading from '@/app/(dashboards)/loading';
import ErrorDisplay from '@/features/todo/components/elements/Error/ErrorDisplay';
import { ErrorBoundary } from 'react-error-boundary';
import { useSession } from 'next-auth/react';

type TodoDataProps = {
  todos: TodoListProps[];
};

type ListDataProps = {
  lists: StatusListProps[];
};

// エミュレーターモード判定ヘルパー関数
const isEmulatorMode = () =>
  process.env.NEXT_PUBLIC_EMULATOR_MODE === 'true' &&
  process.env.NODE_ENV !== 'production';

const fetcher = async (url: string) => {
  const headers: HeadersInit = {
    Accept: 'application/json',
  };

  // 開発・テスト環境ではX-User-IDヘッダーを追加
  if (isEmulatorMode()) {
    headers['X-User-ID'] =
      process.env.NEXT_PUBLIC_TEST_USER_UID || 'test-user-1';
  }

  const response = await fetch(url, {
    credentials: 'include', // セッション情報を送信
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Unknown error');
  }

  return response.json();
};

// URLを動的に構築
const baseUrl =
  process.env.NODE_ENV === 'production'
    ? process.env.NEXTAUTH_URL // サーバー環境
    : ''; // クライアント環境

// APIエンドポイントのURL
const todosApiUrl = `${baseUrl}/api/todos`;
const listsApiUrl = `${baseUrl}/api/lists`;

// 安全な事前読み込み（クライアントのみで実行されることを保証）
if (typeof window !== 'undefined') {
  preload(todosApiUrl, fetcher);
  preload(listsApiUrl, fetcher);
}

// データを取得するためのコンポーネント
const TodoContent = (): React.ReactElement => {
  const { status } = useSession();

  // 開発・テスト環境では認証をスキップ、本番環境では認証確立を待つ
  const emulatorMode = isEmulatorMode();
  const shouldFetch = emulatorMode || status === 'authenticated';

  const {
    data: todosData,
    error: todosError,
    isLoading: todosLoading,
  } = useSWR<TodoDataProps>(shouldFetch ? todosApiUrl : null, fetcher, {
    revalidateOnMount: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    suspense: false,
    shouldRetryOnError: true,
  });

  const {
    data: listsData,
    error: listsError,
    isLoading: listsLoading,
  } = useSWR<ListDataProps>(shouldFetch ? listsApiUrl : null, fetcher, {
    revalidateOnMount: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    suspense: false,
    shouldRetryOnError: true,
  });

  const isLoading = todosLoading || listsLoading;
  const error = todosError || listsError;

  // 認証中の場合はローディング表示
  if (!emulatorMode && status === 'loading') return <TodosLoading />;

  // 本番環境で未認証の場合は認証ページへリダイレクト
  if (!emulatorMode && status === 'unauthenticated') {
    if (typeof window !== 'undefined') {
      window.location.href = '/signin';
    }
    return <TodosLoading />;
  }

  if (error) return <ErrorDisplay message={error.message} />;
  if (isLoading || !todosData || !listsData) return <TodosLoading />;

  const { todos } = todosData;
  const { lists } = listsData;

  return (
    <TodoProvider initialTodos={todos} initialLists={lists}>
      <Box>
        <PushContainer />
        <MainContainer />
      </Box>
    </TodoProvider>
  );
};

// エラー境界のためのコンポーネント
const TodoErrorBoundary = ({ error }: { error: Error }) => {
  return <ErrorDisplay message={error.message} />;
};

// メインラッパーコンポーネント
const TodoWrapper = (): React.ReactElement => {
  return (
    <SWRConfig value={{ suspense: true, revalidateOnFocus: false }}>
      <ErrorBoundary FallbackComponent={TodoErrorBoundary}>
        <TodoContent />
      </ErrorBoundary>
    </SWRConfig>
  );
};

export default TodoWrapper;
