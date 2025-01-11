'use client';

import { useState, useCallback } from 'react';
import { StatusListProps } from '@/types/lists';
import { TodoListProps } from '@/types/todos';
import {
  isDuplicateCategory,
  updateListsAndTodos,
} from '@/app/utils/updateStatusUtils';

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

      if (isDuplicateCategory(lists, finalCategory, id)) {
        alert('リスト名が重複しています');
        return false;
      }

      updateListsAndTodos(setLists, setTodos, id, finalCategory, oldCategory);

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
