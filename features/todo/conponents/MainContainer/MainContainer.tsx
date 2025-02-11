import { Box } from '@mui/material';
import { useTodoContext } from '@/features/todo/contexts/TodoContext';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import SortableItem from '@/features/todo/dnd/SortableItem';
import TodoList from '@/features/todo/conponents/TodoList/TodoList';
import ListAdd from '@/features/todo/conponents/elements/List/ListAdd';
import StatusTitle from '@/features/todo/conponents/elements/Status/StatusTitle';

const MainContainer = () => {
  const { todoHooks, listHooks } = useTodoContext();
  const { todos } = todoHooks;
  const { lists, handleDragEnd } = listHooks;

  return (
    <DndContext
      id={'coustom-id-for-dnd-context'}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={lists.map((list) => list.id)}
        strategy={rectSortingStrategy}
      >
        <Box
          sx={{
            maxWidth: '1660px',
            paddingTop: '80px',
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
                <SortableItem key={statusPull.id} id={statusPull.id}>
                  <Box
                    key={statusPull.id}
                    sx={{
                      minWidth: '320px',
                      width: 320,
                      '@media (max-width: 767px)': {
                        width: '50%',
                        minWidth: 'auto',
                      },
                    }}
                  >
                    <StatusTitle
                      key={statusPull.id}
                      id={statusPull.id}
                      title={statusPull.category}
                      listNumber={statusPull.number}
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
                          display:
                            filteredTrueTodos.length > 0 ? 'block' : 'none',
                          marginBottom: 4,
                        }}
                      >
                        {todos
                          .filter(
                            (todo) =>
                              statusPull.category === todo.status && todo.bool,
                          )
                          .map((todo) => (
                            <TodoList key={todo.id} todo={todo} />
                          ))}
                      </Box>
                      {/* boolがfalseの場合 */}
                      <Box
                        sx={{
                          width: 1,
                          display:
                            filteredFalseTodos.length > 0 ? 'block' : 'none',
                        }}
                      >
                        {todos
                          .filter(
                            (todo) =>
                              statusPull.category === todo.status && !todo.bool,
                          )
                          .map((todo) => (
                            <TodoList key={todo.id} todo={todo} />
                          ))}
                      </Box>
                    </Box>
                  </Box>
                </SortableItem>
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
              <ListAdd />
            </Box>
          </Box>
        </Box>
      </SortableContext>
    </DndContext>
  );
};

MainContainer.displayName = 'MainContainer';

export default MainContainer;
