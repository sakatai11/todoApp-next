'use client';

import { useCallback } from 'react';
import { TodoListProps } from '@/types/todos';
import { StatusListProps } from '@/types/lists';
import { ListPayload } from '@/types/lists';
import { TodoPayload } from '@/types/todos';
import { apiRequest } from '@/app/libs/apis';

type DeleteListProps = {
  todos: TodoListProps[];
  setTodos: React.Dispatch<React.SetStateAction<TodoListProps[]>>;
  setLists: React.Dispatch<React.SetStateAction<StatusListProps[]>>;
};

export const useDeleteList = ({
  todos,
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
        // client
        setLists((prevLists) => {
          // todo.id が id と一致しない list だけを残す新しい配列を作成
          const updatedLists = prevLists.filter((list) => list.id !== id);

          // `number` を 1, 2, 3, ... と再設定
          return updatedLists.map((list, index) => ({
            ...list,
            number: index + 1, // 新しいインデックスに基づいて番号を設定
          }));
        });

        // server side
        // 該当するtodosを削除
        const todosToDelete = todos.filter((todo) => todo.status === title); // 該当する配列を作成
        console.log(todosToDelete);

        // todosToDeleteに配列が存在している場合、todo削除
        if (todosToDelete.length > 0) {
          // 非同期削除処理を並列で実行し、すべての結果を待つ
          const todoResult = await Promise.all(
            todosToDelete.map((todo) =>
              apiRequest<TodoPayload<'DELETE'>>('/api/todos', 'DELETE', {
                id: todo.id,
              }),
            ),
          );

          console.log(todoResult);

          // client
          setTodos((prevTodos) =>
            prevTodos.filter((todo) => todo.status !== title),
          ); // todo.id が id と一致しない todo だけを残す新しい配列を作成
        }
      } catch (error) {
        console.error('Failed to delete list and related todos:', error);
      }
    },
    [todos, setTodos, setLists], // 第二引数に依存配列を指定
  );
  return {
    deleteList,
  };
};
