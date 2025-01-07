'use client';

import { useState, useCallback } from 'react';
import { StatusListProps } from '@/types/lists';
import { TodoListProps } from '@/types/todos';

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

  // 重複カテゴリ名のチェック
  const isDuplicateCategory = (category: string, id: string) => {
    return lists.some((list) => list.category === category && list.id !== id);
  };

  // リストとタスクの更新（最新化）
  const updateListsAndTodos = (
    id: string,
    finalCategory: string,
    oldCategory: string,
  ) => {
    setLists((prevLists) => {
      const updatedLists = prevLists.map((list) =>
        list.id === id ? { ...list, category: finalCategory } : list,
      );

      setTodos((prevTodos) =>
        prevTodos.map((todo) =>
          todo.status === oldCategory
            ? { ...todo, status: finalCategory }
            : todo,
        ),
      );

      return updatedLists;
    });
  };

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

      if (isDuplicateCategory(finalCategory, id)) {
        alert('リスト名が重複しています');
        return false;
      }

      updateListsAndTodos(id, finalCategory, oldCategory);

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
