'use client';

import React, { createContext, useContext } from 'react';
import { TodoListProps, TodoHookType } from '@/types/todos';
import { StatusListProps, ListHookType } from '@/types/lists';
import {
  EditDataProps,
  UpdateStatusAndCategoryHooks,
  DeleteListHooks,
} from '@/types/common';
import { useTodos } from '@/features/todo/hooks/useTodos';
import { useLists } from '@/features/todo/hooks/useLists';
import { useUpdateStatusAndCategory } from '@/features/todo/hooks/useUpdateStatusAndCategory';
import { useDeleteList } from '@/features/todo/hooks/useDeleteList';

type TodoContextType = {
  todoHooks: TodoHookType<EditDataProps>;
  listHooks: ListHookType;
  updateStatusAndCategoryHooks: UpdateStatusAndCategoryHooks<EditDataProps>;
  deleteListHooks: DeleteListHooks;
};

const TodoContext = createContext<TodoContextType | null>(null);

export const useTodoContext = () => {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error('useTodoContext must be used within a TodoProvider');
  }
  return context;
};

export const TodoProvider = ({
  children,
  initialTodos,
  initialLists,
}: {
  children: React.ReactNode;
  initialTodos: TodoListProps[];
  initialLists: StatusListProps[];
}) => {
  const todoHooks = useTodos(initialTodos);
  const listHooks = useLists(initialLists);

  const updateStatusAndCategoryHooks = useUpdateStatusAndCategory({
    todos: todoHooks.todos,
    lists: listHooks.lists,
    setTodos: todoHooks.setTodos,
    setLists: listHooks.setLists,
  });

  const deleteListHooks = useDeleteList({
    todos: todoHooks.todos,
    setTodos: todoHooks.setTodos,
    setLists: listHooks.setLists,
  });

  return (
    <TodoContext.Provider
      value={{
        todoHooks,
        listHooks,
        updateStatusAndCategoryHooks,
        deleteListHooks,
      }}
    >
      {children}
    </TodoContext.Provider>
  );
};
