'use client';

import { TodoListProps } from '@/types/todos';
import { StatusListProps } from '@/types/lists';
import { Box } from '@mui/material';
import PushContainer from '@/features/todo/conponents/PushContainer/PushContainer';
import MainContainer from '@/features/todo/conponents/MainContainer/MainContainer';
// import { useTodos } from '@/features/todo/hooks/useTodos';
// import { useLists } from '@/features/todo/hooks/useLists';
// import { useUpdateStatusAndCategory } from '@/features/todo/hooks/useUpdateStatusAndCategory';
// import { useDeleteList } from '@/features/todo/hooks/useDeleteList';
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
        <PushContainer
        // statusPull={listHooks.lists}
        // isEditing={todoHooks.editId !== null}
        />
        <MainContainer
        // todoHooks={todoHooks}
        // listHooks={listHooks}
        // updateStatusAndCategoryHooks={updateStatusAndCategoryHooks}
        // deleteListHooks={deleteListHooks}
        />
      </Box>
    </TodoProvider>
  );
};

export default TodoWrapper;
