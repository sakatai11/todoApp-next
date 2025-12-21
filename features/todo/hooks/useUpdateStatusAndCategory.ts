'use client';

import { useState, useCallback } from 'react';
import { ListPayload, StatusListProps, ListResponse } from '@/types/lists';
import { TodoListProps, TodoPayload, TodoResponse } from '@/types/todos';
import { trimAllSpaces } from '@/features/utils/validationUtils';
import {
  isDuplicateCategory,
  updateListsAndTodos,
} from '@/features/utils/updateStatusUtils';
import { apiRequest } from '@/features/libs/apis';

type UpdateDataProp = {
  todos: TodoListProps[];
  lists: StatusListProps[];
  setTodos: React.Dispatch<React.SetStateAction<TodoListProps[]>>;
  setLists: React.Dispatch<React.SetStateAction<StatusListProps[]>>;
};

export const useUpdateStatusAndCategory = ({
  lists,
  setTodos,
  setLists,
}: UpdateDataProp) => {
  //
  // ***** state ******
  //
  const [editId, setEditId] = useState<string | null>(null);

  //
  // ***** actions ******
  //
  // 編集（リスト名）
  const editList = useCallback(
    async (
      id: string,
      newCategory: string,
      oldCategory: string,
      initialTitle: string,
    ) => {
      const finalCategory =
        trimAllSpaces(newCategory) || trimAllSpaces(initialTitle);

      if (isDuplicateCategory(lists, finalCategory, id)) {
        alert('リスト名が重複しています');
        return false;
      }

      try {
        // server side
        // categoryの更新
        await apiRequest<ListPayload<'PUT'>, ListResponse<'PUT'>>(
          '/api/lists',
          'PUT',
          {
            type: 'update',
            id,
            data: { category: finalCategory },
          },
        );

        // statusの更新
        await apiRequest<TodoPayload<'PUT'>, TodoResponse<'PUT'>>(
          '/api/todos',
          'PUT',
          {
            type: 'restatus',
            data: { oldStatus: oldCategory, status: finalCategory },
          },
        );

        // client
        updateListsAndTodos(setLists, setTodos, id, finalCategory, oldCategory);
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
