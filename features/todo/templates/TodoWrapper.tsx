'use client';

import { TodoListProps } from '@/types/todos';
import { StatusListProps } from '@/types/lists';
import { Box } from '@mui/material';
import PushContainer from '@/features/todo/components/PushContainer/PushContainer';
import MainContainer from '@/features/todo/components/MainContainer/MainContainer';
import { TodoProvider } from '@/features/todo/contexts/TodoContext';
import useSWR, { SWRConfig, preload } from 'swr';
import TodosLoading from '@/app/(dashboard)/loading';
import ErrorDisplay from '@/features/todo/components/elements/Error/ErrorDisplay';
import { ErrorBoundary } from 'react-error-boundary';

type DataProps = {
  todos: TodoListProps[];
  lists: StatusListProps[];
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

// APIを事前読み込み
preload('/api/info', fetcher);

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
  const { todos, lists } = data as DataProps;

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
