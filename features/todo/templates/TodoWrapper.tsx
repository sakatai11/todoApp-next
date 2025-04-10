'use client';

import { TodoListProps } from '@/types/todos';
import { StatusListProps } from '@/types/lists';
import { Box } from '@mui/material';
import PushContainer from '@/features/todo/components/PushContainer/PushContainer';
import MainContainer from '@/features/todo/components/MainContainer/MainContainer';
import { TodoProvider } from '@/features/todo/contexts/TodoContext';
import useSWR from 'swr';

type DataProps = {
  todos: TodoListProps[];
  lists: StatusListProps[];
};

const fetcher = async (url: string) => {
  const response = await fetch(url, {
    credentials: 'include', // セッション情報を送信
  });

  if (!response.ok) {
    throw new Error('Failed to fetch');
  }

  return response.json();
};

const TodoWrapper = (): React.ReactElement => {
  const { data, error } = useSWR<DataProps>('/api/info', fetcher, {
    revalidateOnMount: true, // マウント時に一度だけ取得（デフォルトtrue）
    revalidateOnFocus: false, // フォーカス時の再取得を無効化
    revalidateOnReconnect: false, // 再接続時の再取得を無効化
  });

  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>Loading...</div>;

  const { todos, lists } = data;

  return (
    <TodoProvider initialTodos={todos} initialLists={lists}>
      <Box>
        <PushContainer />
        <MainContainer />
      </Box>
    </TodoProvider>
  );
};

export default TodoWrapper;
