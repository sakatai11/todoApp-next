import { Box } from '@mui/material';
import { TodoListProps } from '@/types/todos';
import { StatusListProps } from '@/types/lists';
import TodoList from '@/features/todo/conponents/TodoList/TodoList';
import StatusTitle from '@/features/todo/conponents/elements/Status/StatusTitle';
import ListAdd from '@/features/todo/conponents/elements/List/ListAdd';

type DataProps = {
  todos: TodoListProps[];
  lists: StatusListProps[];
  deleteList: (id: string, title: string) => void;
  statusTitleOption: {
    listEdit: string | null;
    editList: (
      id: string,
      value: string,
      title: string,
      initialTitle: string,
    ) => Promise<boolean>;
    setListEdit: (id: string) => void;
  };
  todoListOption: {
    todoInput: { text: string; status: string };
    editId: string | null;
    todoError: { listPushArea: boolean; listModalArea: boolean };
    deleteTodo: (id: string) => void;
    editTodo: (id: string) => void;
    saveTodo: () => void;
    setEditId: (id: string | null) => void;
    setTodoInput: (input: { text: string; status: string }) => void; // setInputもオブジェクトを受け取るように変更
    setTodoError: (error: {
      listPushArea: boolean;
      listModalArea: boolean;
    }) => void;
    toggleSelected: (id: string) => void;
  };
  listAddOption: {
    statusList: string;
    listError: { addListNull: boolean; addListSame: boolean };
    addList: () => Promise<boolean>;
    setListInput: (input: { status: string }) => void;
    setListError: (error: {
      addListNull: boolean;
      addListSame: boolean;
    }) => void;
  };
};

const MainContainer = ({
  todos,
  lists,
  deleteList,
  statusTitleOption,
  todoListOption,
  listAddOption,
}: DataProps): React.ReactElement => {
  const { listEdit, editList, setListEdit } = statusTitleOption;

  const {
    todoInput,
    editId,
    todoError,
    deleteTodo,
    editTodo,
    saveTodo,
    setEditId,
    setTodoInput,
    setTodoError,
    toggleSelected,
  } = todoListOption;

  const { statusList, listError, addList, setListInput, setListError } =
    listAddOption;

  return (
    <>
      <Box
        sx={{
          maxWidth: '1660px',
          width: '100%',
          margin: '0 auto',
          overflowX: 'auto',
          '@media (max-width: 767px)': {
            width: 1,
          },
        }}
      >
        <Box
          display="flex"
          justifyContent="flex-start"
          // flexWrap='wrap'
          mt={4}
          px={3}
          sx={{
            '@media (max-width: 767px)': {
              px: 0,
              width: 1,
              flexWrap: 'wrap' /* 追加 */,
            },
          }}
        >
          {lists.map((statusPull) => {
            const filteredTrueTodos = todos.filter(
              (todo) => statusPull.category === todo.status && todo.bool,
            );
            const filteredFalseTodos = todos.filter(
              (todo) => statusPull.category === todo.status && !todo.bool,
            );

            return (
              <Box
                key={statusPull.id}
                sx={{
                  minWidth: '320px',
                  '@media (max-width: 767px)': {
                    width: '50%',
                    minWidth: 'auto',
                  },
                }}
              >
                <StatusTitle
                  title={statusPull.category}
                  id={statusPull.id}
                  isEditing={statusPull.id === listEdit} // true
                  editList={editList}
                  deleteList={deleteList}
                  setListEdit={setListEdit}
                />
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    overflow: 'auto',
                    '@media (max-width: 767px)': {
                      p: 1.2,
                    },
                  }}
                  p={2}
                >
                  {/* boolがtrueの場合 */}
                  <Box
                    sx={{
                      width: 1,
                      display: filteredTrueTodos.length > 0 ? 'block' : 'none',
                      marginBottom: 4,
                    }}
                  >
                    {todos
                      .filter(
                        (todo) =>
                          statusPull.category === todo.status && todo.bool,
                      )
                      .map((todo) => (
                        <TodoList
                          key={todo.id}
                          todo={todo}
                          deleteTodo={deleteTodo}
                          editTodo={editTodo}
                          saveTodo={saveTodo}
                          setEditId={setEditId}
                          statusPull={lists}
                          isEditing={editId === todo.id}
                          input={todoInput}
                          setInput={setTodoInput}
                          error={todoError.listModalArea}
                          setError={(modalError) =>
                            setTodoError({
                              ...todoError,
                              listModalArea: modalError,
                            })
                          }
                          toggleSelected={() => {
                            if (todo.id) {
                              toggleSelected(todo.id);
                            }
                          }} // idがundefinedでないことを確認
                        />
                      ))}
                  </Box>
                  {/* boolがfalseの場合 */}
                  <Box
                    sx={{
                      width: 1,
                      display: filteredFalseTodos.length > 0 ? 'block' : 'none',
                    }}
                  >
                    {todos
                      .filter(
                        (todo) =>
                          statusPull.category === todo.status && !todo.bool,
                      )
                      .map((todo) => (
                        <TodoList
                          key={todo.id}
                          todo={todo}
                          deleteTodo={deleteTodo}
                          editTodo={editTodo}
                          saveTodo={saveTodo}
                          setEditId={setEditId}
                          statusPull={lists}
                          isEditing={editId === todo.id}
                          input={todoInput}
                          setInput={setTodoInput}
                          error={todoError.listModalArea}
                          setError={(modalError) =>
                            setTodoError({
                              ...todoError,
                              listModalArea: modalError,
                            })
                          }
                          toggleSelected={() => {
                            if (todo.id) {
                              toggleSelected(todo.id);
                            }
                          }} // idがundefinedでないことを確認
                        />
                      ))}
                  </Box>
                </Box>
              </Box>
            );
          })}
          <Box
            sx={{
              minWidth: '320px',
              paddingX: '16px',
              boxSizing: 'border-box',
              '@media (max-width: 767px)': {
                width: '100%',
                minWidth: 'auto',
              },
            }}
          >
            <ListAdd
              status={statusList}
              error={listError}
              addList={addList}
              setInput={(listStatus) => setListInput({ status: listStatus })}
              setError={setListError}
            />
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default MainContainer;
