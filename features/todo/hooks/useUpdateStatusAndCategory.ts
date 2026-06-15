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
import { useError } from '@/features/todo/contexts/ErrorContext';
import { ERROR_MESSAGES } from '@/constants/errorMessages';

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
  const { showError } = useError(); // グローバルエラー（APIエラー等）
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
    ): Promise<boolean> => {
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

        // 全ての処理が成功した場合のみ true を返す
        return true;
      } catch (error) {
        console.error('Error puting list or todo:', error);
        // API失敗時はUIに成功表示させず、エラーを通知して false を返す
        showError(ERROR_MESSAGES.LIST.UPDATE_FAILED);
        return false;
      }
    },
    [lists, setLists, setTodos, showError],
  );

  return {
    editId,
    editList,
    setEditId,
  };
};
