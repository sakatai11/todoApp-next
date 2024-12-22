import { TodoListProps } from '@/types/todos';
import { StatusListProps } from '@/types/lists';
import { Box } from '@mui/material';
import PushContainer from '@/features/todo/conponents/PushContainer/PushContainer';
import MainContainer from '@/features/todo/conponents/MainContainer/MainContainer';
import { useTodos } from '@/features/todo/hooks/useTodos';
import { useLists } from '@/features/todo/hooks/useLists';
import { useDeleteList } from '@/features/todo/hooks/useDeleteList';

type DataProps = {
  initialTodos: TodoListProps[];
  initialLists: StatusListProps[];
};

const TodoWrapper = ({
  initialTodos,
  initialLists,
}: DataProps): React.ReactElement => {
  const {
    todos,
    input: todoInput,
    editId,
    error: todoError,
    setTodos,
    setEditId,
    addTodo,
    deleteTodo,
    editTodo,
    saveTodo,
    toggleSelected,
    setInput: setTodoInput,
    setError: setTodoError,
  } = useTodos(initialTodos);

  const {
    lists,
    input: listInput,
    error: listError,
    addList,
    setLists,
    setInput: setListInput,
    setError: setListError,
  } = useLists(initialLists);

  // useCallback使用、react.memo使用する可能性あり
  const { deleteList } = useDeleteList({ todos, lists, setTodos, setLists });

  return (
    <Box>
      <PushContainer
        addTodo={addTodo}
        setTodoInput={setTodoInput}
        setEditId={setEditId}
        todoInput={todoInput}
        statusPull={lists}
        isEditing={editId !== null} // idがない場合はfalse
        error={todoError.listPushArea}
        setError={(pushError) =>
          setTodoError({ ...todoError, listPushArea: pushError })
        }
      />
      <MainContainer
        todos={todos}
        lists={lists}
        deleteList={deleteList}
        todoListOption={{
          todoInput: todoInput,
          editId: editId,
          todoError: todoError,
          deleteTodo: deleteTodo,
          editTodo: editTodo,
          saveTodo: saveTodo,
          setEditId: setEditId,
          setTodoInput: setTodoInput,
          setTodoError: setTodoError,
          toggleSelected: toggleSelected,
        }}
        listAddOption={{
          status: listInput.status,
          listError: listError.addListArea,
          addList: addList,
          setListInput: setListInput,
          setListError: setListError,
        }}
      />
    </Box>
  );
};

export default TodoWrapper;
