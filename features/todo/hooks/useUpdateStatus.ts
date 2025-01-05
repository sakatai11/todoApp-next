'use client';

import { useState, useCallback } from 'react';
import { StatusListProps } from '@/types/lists';
import { TodoListProps } from '@/types/todos';
// import { ListPayload } from '@/types/lists';
// import { apiRequest } from '@/app/libs/apis';

type UpdateDataProp = {
  todos: TodoListProps[];
  lists: StatusListProps[];
  setTodos: React.Dispatch<React.SetStateAction<TodoListProps[]>>;
  setLists: React.Dispatch<React.SetStateAction<StatusListProps[]>>;
};

export const useUpdateStatus = ({
  todos,
  lists,
  setTodos,
  setLists,
}: UpdateDataProp) => {
  const [input, setInput] = useState({ status: '' });
  const [editId, setEditId] = useState<string | null>(null);

  console.log(todos);
  console.log(lists);

  // 編集（リスト名）
  const editList = useCallback(
    (id: string, newCategory: string, oldCategory: string) => {
      // 同じカテゴリ名がすでに存在するかチェック
      const isDuplicate = lists.some(
        (list) => list.category === newCategory && list.id !== id,
      );

      if (isDuplicate) {
        console.log('カテゴリ名が重複しています');
        return; // 処理を中断
      }

      setLists((prevLists) =>
        prevLists.map((list) =>
          list.id === id ? { ...list, category: newCategory } : list,
        ),
      );

      setTodos((prevTodos) =>
        prevTodos.map((todo) =>
          todo.status === oldCategory ? { ...todo, status: newCategory } : todo,
        ),
      );

      // 状態更新後に入力欄をリセットまたは更新したい場合
      setInput({ status: newCategory });
    },
    [setLists, setTodos], // 依存関係を指定
  );

  return {
    input,
    editId,
    editList,
    setEditId,
    setInput,
  };
};
