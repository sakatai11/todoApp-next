'use client';

import { useCallback } from 'react';
import { TodoListProps } from '@/types/todos';
import { StatusListProps } from '@/types/lists';
import { db } from '@/app/utils/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

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
        // リストを削除
        await deleteDoc(doc(db, 'lists', id.toString()));
        setLists(lists.filter((list) => list.id !== id)); // todo.id が id と一致しない list だけを残す新しい配列を作成

        // 該当するtodosを削除
        const todosToDelete = todos.filter((todo) => todo.status === title); // 該当する配列を作成
        console.log(todosToDelete);

        if (todosToDelete.length > 0) {
          const deleteTodoPromises = todosToDelete.map((todo) =>
            todo.id ? deleteDoc(doc(db, 'todos', todo.id)) : Promise.resolve(),
          );

          // すべてのTodo削除が完了するまで待つ
          await Promise.all(deleteTodoPromises);
          setTodos(todos.filter((todo) => todo.status !== title)); // todo.id が id と一致しない todo だけを残す新しい配列を作成
        }
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
