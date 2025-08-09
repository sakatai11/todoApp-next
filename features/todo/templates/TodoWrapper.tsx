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

type TodoDataProps = {
  todos: TodoListProps[];
};

type ListDataProps = {
  lists: StatusListProps[];
};

const fetcher = async (url: string) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // 開発・テスト環境ではX-User-IDヘッダーを追加
  if (process.env.NEXT_PUBLIC_EMULATOR_MODE === 'true') {
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
  const {
    data: todosData,
    error: todosError,
    isLoading: todosLoading,
  } = useSWR<TodoDataProps>('/api/todos', fetcher, {
    revalidateOnMount: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    suspense: false,
    shouldRetryOnError: false,
  });

  const {
    data: listsData,
    error: listsError,
    isLoading: listsLoading,
  } = useSWR<ListDataProps>('/api/lists', fetcher, {
    revalidateOnMount: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    suspense: false,
    shouldRetryOnError: false,
  });

  const isLoading = todosLoading || listsLoading;
  const error = todosError || listsError;

  if (isLoading || !todosData || !listsData) return <TodosLoading />;
  if (error) return <ErrorDisplay message={error.message} />;

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
