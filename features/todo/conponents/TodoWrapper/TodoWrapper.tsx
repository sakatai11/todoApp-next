'use client';
import { useState } from 'react';
import { TodoListProps } from '@/types/todos';
import { StatusListProps } from '@/types/lists';
import { Box } from '@mui/material';
import TodoContainer from '@/features/todo/conponents/TodoContainer/TodoContainer';

type DataProps = {
  initialTodos: TodoListProps[];
  initialLists: StatusListProps[];
};

const TodoWrapper = ({
  initialTodos,
  initialLists,
}: DataProps): React.ReactElement => {
  const [todos, setTodos] = useState<TodoListProps[]>(initialTodos);
  const [lists, setLists] = useState<StatusListProps[]>(initialLists);

  return (
    <Box>
      {/* Push */}
      <TodoContainer todos={todos} lists={lists} />
    </Box>
  );
};

export default TodoWrapper;
