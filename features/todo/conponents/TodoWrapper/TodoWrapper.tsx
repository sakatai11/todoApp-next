'use client';

import { TodoListProps } from '@/types/todos';
import { StatusListProps } from '@/types/lists';
import { Box } from '@mui/material';

type DataProps = {
  todos: TodoListProps[];
  lists: StatusListProps[];
};

const TodoWrapper = ({ todos, lists }: DataProps): React.ReactElement => {
  return (
    <Box>
      <Box>
        {todos.map((todo) => (
          <div key={todo.id}>
            <p>ID: {todo.id}</p>
            <p>Text: {todo.text}</p>
            <p>Status: {todo.status}</p>
            <p>Time: {todo.time}</p>
          </div>
        ))}
      </Box>
      <Box>
        {lists.map((list) => (
          <div key={list.id}>
            <p>ID: {list.id}</p>
            <p>Status: {list.category}</p>
          </div>
        ))}
      </Box>
    </Box>
  );
};

export default TodoWrapper;
