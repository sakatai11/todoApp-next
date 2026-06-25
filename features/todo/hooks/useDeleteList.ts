'use client';

import { useCallback } from 'react';
import { TodoListProps, TodoPayload, TodoResponse } from '@/types/todos';
import { StatusListProps, ListPayload, ListResponse } from '@/types/lists';
import { apiRequest } from '@/features/libs/apis';
import { useError } from '@/features/todo/contexts/ErrorContext';
import { ERROR_MESSAGES } from '@/constants/errorMessages';

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
  const { showError } = useError();

  //
  // ***** actions ******
  //
  const deleteList = useCallback(
    async (id: string, title: string): Promise<void> => {
      try {
        // server side
        // リストを削除
        await apiRequest<ListPayload<'DELETE'>, ListResponse<'DELETE'>>(
          '/api/lists',
          'DELETE',
          { id },
        );

        // server side
        // 該当するtodosを削除
        const todosToDelete = todos.filter((todo) => todo.status === title); // 該当する配列を作成

        // todosToDeleteに配列が存在している場合、todo削除
        if (todosToDelete.length > 0) {
          // 非同期削除処理を並列で実行し、すべての結果を待つ
          await Promise.all(
            todosToDelete.map((todo) =>
              apiRequest<TodoPayload<'DELETE'>, TodoResponse<'DELETE'>>(
                '/api/todos',
                'DELETE',
                {
                  id: todo.id,
                },
              ),
            ),
          );
        }

        // client
        setLists((prevLists) => {
          // todo.id が id と一致しない list だけを残す新しい配列を作成
          const updatedLists = prevLists
            .filter((list) => list.id !== id)
            .sort((a, b) => a.number - b.number);

          // `number` を 1, 2, 3, ... と再設定
          return updatedLists.map((list, index) => ({
            ...list,
            number: index + 1, // 新しいインデックスに基づいて番号を設定
          }));
        });

        if (todosToDelete.length > 0) {
          setTodos((prevTodos) =>
            prevTodos.filter((todo) => todo.status !== title),
          ); // todo.id が id と一致しない todo だけを残す新しい配列を作成
        }
      } catch (error) {
        console.error('Failed to delete list and related todos:', error);
        showError(ERROR_MESSAGES.LIST.DELETE_FAILED);
      }
    },
    [todos, setTodos, setLists, showError], // 第二引数に依存配列を指定
  );
  return {
    deleteList,
  };
};
