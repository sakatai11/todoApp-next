'use client';

import { TodoListProps } from '@/types/todos';
import { StatusListProps } from '@/types/lists';
import { Box } from '@mui/material';
import { PushContainer, MainContainer } from '@/features/todo/components';
import { TodoProvider } from '@/features/todo/contexts/TodoContext';
import useSWR, { SWRConfig, preload } from 'swr';
import TodosLoading from '@/app/(dashboard)/loading';
import ErrorDisplay from '@/features/todo/components/elements/Error/ErrorDisplay';
import { ErrorBoundary } from 'react-error-boundary';

type DataProps = {
  contents: {
    todos: TodoListProps[];
    lists: StatusListProps[];
  };
};

const fetcher = async (url: string) => {
  const response = await fetch(url, {
    credentials: 'include', // セッション情報を送信
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Unknown error');
  }

  return response.json();
};

// URLを動的に構築
const baseUrl = process.env.NEXTAUTH_URL;
const apiUrl = `${baseUrl}/api/info`;

// 安全な事前読み込み（クライアントのみで実行されることを保証）
if (typeof window !== 'undefined') {
  preload(apiUrl, fetcher);
}

// データを取得するためのコンポーネント
const TodoContent = (): React.ReactElement => {
  const { data, error, isLoading } = useSWR<DataProps>('/api/info', fetcher, {
    revalidateOnMount: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    suspense: false,
  });

  if (isLoading) return <TodosLoading />;
  if (error) return <ErrorDisplay message={error.message} />;

  // suspense:trueの場合、dataはneverになるのでnullチェック不要
  const { contents } = data as DataProps;
  const { todos, lists } = contents;

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
