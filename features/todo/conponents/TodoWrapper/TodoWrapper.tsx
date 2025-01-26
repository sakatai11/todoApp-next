'use client';

import { TodoListProps } from '@/types/todos';
import { StatusListProps } from '@/types/lists';
import { Box } from '@mui/material';
import PushContainer from '@/features/todo/conponents/PushContainer/PushContainer';
import MainContainer from '@/features/todo/conponents/MainContainer/MainContainer';
import { useTodos } from '@/features/todo/hooks/useTodos';
import { useLists } from '@/features/todo/hooks/useLists';
import { useUpdateStatusAndCategory } from '@/features/todo/hooks/useUpdateStatusAndCategory';
import { useDeleteList } from '@/features/todo/hooks/useDeleteList';

type DataProps = {
  initialTodos: TodoListProps[];
  initialLists: StatusListProps[];
};

const TodoWrapper = ({
  initialTodos,
  initialLists,
}: DataProps): React.ReactElement => {
  const todoHooks = useTodos(initialTodos);
  const listHooks = useLists(initialLists);

  // useCallback使用
  const updateStatusAndCategoryHooks = useUpdateStatusAndCategory({
    todos: todoHooks.todos,
    lists: listHooks.lists,
    setTodos: todoHooks.setTodos,
    setLists: listHooks.setLists,
  });

  // useCallback使用
  const deleteListHooks = useDeleteList({
    todos: todoHooks.todos,
    setTodos: todoHooks.setTodos,
    setLists: listHooks.setLists,
  });

  return (
    <Box>
      <PushContainer
        {...todoHooks}
        statusPull={listHooks.lists}
        isEditing={todoHooks.editId !== null}
      />
      <MainContainer
        todoHooks={todoHooks}
        listHooks={listHooks}
        updateStatusAndCategoryHooks={updateStatusAndCategoryHooks}
        deleteListHooks={deleteListHooks}
      />
    </Box>
  );
};

export default TodoWrapper;
