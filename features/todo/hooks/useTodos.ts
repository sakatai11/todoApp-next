'use client';

import { useState } from 'react';
import { TodoListProps, TodoPayload } from '@/types/todos';
import { db } from '@/app/libs/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { apiRequest } from '@/app/libs/apis';
import { jstTime } from '@/app/utils/dateUtils';

export const useTodos = (initialTodos: TodoListProps[]) => {
  const [todos, setTodos] = useState<TodoListProps[]>(initialTodos);
  const [input, setInput] = useState({ text: '', status: '' });
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState({
    listPushArea: false,
    listModalArea: false,
  });

  // todo追加
  const addTodo = async () => {
    if (input.text && input.status) {
      const newTodo = {
        time: jstTime().getTime(),
        text: input.text,
        bool: false,
        status: input.status,
      };
      console.log(newTodo);

      try {
        const result = await apiRequest<TodoPayload<'POST'>>(
          '/api/todos',
          'POST',
          newTodo,
        );
        console.log(result);

        setTodos((prevTodos) => {
          const updatedTodos = [...prevTodos, result as TodoListProps];
          return updatedTodos.sort((a, b) => {
            const boolComparison = Number(b.bool) - Number(a.bool);
            const timeComparison = b.time - a.time;
            return boolComparison || timeComparison; // 両方の条件を実行
          });
        });
        setInput({ text: '', status: '' });
        setError((prevError) => ({ ...prevError, listPushArea: false })); // エラーをリセット
      } catch (error) {
        console.error('Error adding todo:', error);
        setError((prevError) => ({ ...prevError, listPushArea: true })); // エラー表示
      }
    } else {
      setError((prevError) => ({ ...prevError, listPushArea: true })); // エラー表示
      return;
    }
  };

  // todo削除
  const deleteTodo = async (id: string) => {
    console.log(`Deleting todo with id: ${id}`);
    // try{
    //   const result = await apiRequest<TodoListProps>(
    //     '/api/todos',
    //     'DELETE',
    //     id,
    //   );
    // }catch (error){

    // }
    setTodos(todos.filter((todo) => todo.id !== id)); // todo.id が id と一致しない todo だけを残す新しい配列を作成
  };

  // 編集（モーダル内）
  const editTodo = (id: string) => {
    const todoToEdit = todos.find((todo) => todo.id === id); // todo.id が指定された id と一致するかどうかをチェック
    if (todoToEdit) {
      setInput({ ...input, text: todoToEdit.text, status: todoToEdit.status });
      setEditId(id);
    }
  };

  // 選択状態を切り替える関数
  const toggleSelected = async (id: string) => {
    // 更新するboolの値を取得
    const todoToUpdate = todos.find((todo) => todo.id === id);
    if (todoToUpdate) {
      setTodos((prevTodos) => {
        // trueの場合、
        const updatedTodos = prevTodos.map((todo) =>
          todo.id === id ? { ...todo, bool: !todo.bool } : todo,
        );
        return updatedTodos.sort((a, b) => Number(b.bool) - Number(a.bool));
      });
      console.log('test');
      await updateDoc(doc(db, 'todos', id), { bool: !todoToUpdate.bool });
    }
  };

  // 保存
  const saveTodo = async () => {
    if (editId !== null) {
      // trueの場合
      const todoToUpdate = todos.find((todo) => todo.id === editId);
      if (todoToUpdate && input.text && input.status) {
        await updateDoc(doc(db, 'todos', editId), {
          text: input.text,
          status: input.status,
          time: jstTime().getTime(),
        });
        console.log(input);
        setTodos(
          todos.map((todo) =>
            todo.id === editId
              ? { ...todo, text: input.text, status: input.status }
              : todo,
          ),
        );
        setInput({ text: '', status: '' });
        setEditId(null);
        setError({ ...error, listModalArea: false }); // エラーをリセット
      } else {
        setError({ ...error, listModalArea: true }); // エラーを表示
        return;
      }
    }
  };

  return {
    todos,
    input,
    editId,
    error,
    setTodos,
    setEditId,
    addTodo,
    deleteTodo,
    editTodo,
    saveTodo,
    toggleSelected,
    setInput,
    setError,
  };
};
