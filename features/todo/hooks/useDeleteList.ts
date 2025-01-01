'use client';

import { useCallback } from 'react';
import { TodoListProps } from '@/types/todos';
import { StatusListProps } from '@/types/lists';
import { ListPayload } from '@/types/lists';
import { TodoPayload } from '@/types/todos';
import { apiRequest } from '@/app/libs/apis';

type DeleteListProps = {
  todos: TodoListProps[];
  lists: StatusListProps[];
  setTodos: React.Dispatch<React.SetStateAction<TodoListProps[]>>;
  setLists: React.Dispatch<React.SetStateAction<StatusListProps[]>>;
};

export const useDeleteList = ({
  todos,
  lists,
  setTodos,
  setLists,
}: DeleteListProps) => {
  const deleteList = useCallback(
    async (id: string, title: string) => {
      try {
        // server side
        // リストを削除
        const result = await apiRequest<ListPayload<'DELETE'>>(
          '/api/lists',
          'DELETE',
          { id },
        );
        console.log(result);

        // 該当するtodosを削除
        const todosToDelete = todos.filter((todo) => todo.status === title); // 該当する配列を作成
        console.log(todosToDelete);

        if (todosToDelete.length > 0) {
          const todoResult = todosToDelete.map(async (todo) => {
            if (todo.id) {
              console.log('true');
              return await apiRequest<TodoPayload<'DELETE'>>(
                '/api/todos',
                'DELETE',
                { id: todo.id },
              );
            }
          });
          console.log(todoResult);
        }
        // client
        setLists(lists.filter((list) => list.id !== id)); // todo.id が id と一致しない list だけを残す新しい配列を作成
        setTodos(todos.filter((todo) => todo.status !== title)); // todo.id が id と一致しない todo だけを残す新しい配列を作成
      } catch (error) {
        console.error('Failed to delete list and related todos:', error);
      }
    },
    [todos, lists, setTodos, setLists], // 第二引数に依存配列を指定
  );
  return {
    deleteList,
  };
};
