import { Box } from '@mui/material';
import { TodoListProps } from '@/types/todos';
import { StatusListProps } from '@/types/lists';

type DataProps = {
  todos: TodoListProps[];
  lists: StatusListProps[];
};

const TodoContainer = ({ todos, lists }: DataProps): React.ReactElement => {
  return (
    <>
      {/* Title */}
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
      {/* addList */}
    </>
  );
};

export default TodoContainer;
