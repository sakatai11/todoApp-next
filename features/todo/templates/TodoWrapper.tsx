'use client';

import { TodoListProps } from '@/types/todos';
import { StatusListProps } from '@/types/lists';
import { Box } from '@mui/material';
import PushContainer from '@/features/todo/conponents/PushContainer/PushContainer';
import MainContainer from '@/features/todo/conponents/MainContainer/MainContainer';
import { TodoProvider } from '@/features/todo/contexts/TodoContext';

type DataProps = {
  initialTodos: TodoListProps[];
  initialLists: StatusListProps[];
};

const TodoWrapper = ({
  initialTodos,
  initialLists,
}: DataProps): React.ReactElement => {
  return (
    <TodoProvider initialTodos={initialTodos} initialLists={initialLists}>
      <Box>
        <PushContainer />
        <MainContainer />
      </Box>
    </TodoProvider>
  );
};

export default TodoWrapper;
