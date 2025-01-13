'use client';

import { useState, useCallback } from 'react';
import { ListPayload, StatusListProps } from '@/types/lists';
import { TodoListProps, TodoPayload } from '@/types/todos';
import {
  isDuplicateCategory,
  updateListsAndTodos,
} from '@/app/utils/updateStatusUtils';
import { apiRequest } from '@/app/libs/apis';

type UpdateDataProp = {
  todos: TodoListProps[];
  lists: StatusListProps[];
  setTodos: React.Dispatch<React.SetStateAction<TodoListProps[]>>;
  setLists: React.Dispatch<React.SetStateAction<StatusListProps[]>>;
};

export const useUpdateStatus = ({
  // todos,
  lists,
  setTodos,
  setLists,
}: UpdateDataProp) => {
  const [editId, setEditId] = useState<string | null>(null);

  // 編集（リスト名）
  const editList = useCallback(
    async (
      id: string,
      newCategory: string,
      oldCategory: string,
      initialTitle: string,
    ) => {
      const finalCategory = newCategory || initialTitle;
      console.log(finalCategory);
      console.log(initialTitle);
      console.log(oldCategory);

      try {
        // client
        if (isDuplicateCategory(lists, finalCategory, id)) {
          alert('リスト名が重複しています');
          return false;
        }
        updateListsAndTodos(setLists, setTodos, id, finalCategory, oldCategory);

        // server side
        // categoryの更新
        const resultList = await apiRequest<ListPayload<'PUT'>>(
          '/api/lists',
          'PUT',
          { id, category: finalCategory },
        );
        console.log(resultList);

        // statusの更新
        const resultTodo = await apiRequest<TodoPayload<'PUT'>>(
          '/api/todos',
          'PUT',
          { oldStatus: oldCategory, status: finalCategory },
        );
        console.log(resultTodo);
      } catch (error) {
        console.error('Error puting list or todo:', error);
      }
      return true;
    },
    [lists, setLists, setTodos],
  );

  return {
    editId,
    editList,
    setEditId,
  };
};
