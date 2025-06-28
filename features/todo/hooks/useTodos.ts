'use client';

import { useState, useCallback } from 'react';
import { TodoListProps, TodoPayload, TodoResponse } from '@/types/todos';
import { apiRequest } from '@/features/libs/apis';
import { jstTime } from '@/features/utils/dateUtils';

export const useTodos = (initialTodos: TodoListProps[]) => {
  //
  // ***** state ******
  //
  const [todos, setTodos] = useState<TodoListProps[]>(initialTodos);
  const [input, setInput] = useState<{ text: string; status: string }>({
    text: '',
    status: '',
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<{
    listPushArea: boolean;
    listModalArea: boolean;
  }>({
    listPushArea: false,
    listModalArea: false,
  });
  // アクティブなAddTodoコンポーネントのステータスを保持
  const [addTodoOpenStatus, setAddTodoOpenStatus] = useState<string | null>(
    null,
  );

  //
  // ***** actions ******
  //
  // todo追加
  const addTodo = useCallback(async () => {
    if (input.text && input.status) {
      const newTodo = {
        updateTime: jstTime().getTime().toString(),
        createdTime: jstTime().getTime().toString(),
        text: input.text,
        bool: false,
        status: input.status,
      };

      try {
        // server side
        const result = await apiRequest<
          TodoPayload<'POST', true>,
          TodoResponse<'POST'>
        >('/api/todos', 'POST', newTodo);

        // client
        setTodos((prevTodos: TodoListProps[]) => {
          const updatedTodos = [...prevTodos, result as TodoListProps];
          return updatedTodos.sort((a, b) => {
            const getTime = (timestamp: unknown) => {
              if (typeof timestamp === 'number') return timestamp;
              if (
                timestamp &&
                typeof (timestamp as { toMillis?: () => number }).toMillis ===
                  'function'
              ) {
                return (timestamp as { toMillis: () => number }).toMillis();
              }
              return parseInt(String(timestamp)) || 0;
            };
            return getTime(b.createdTime) - getTime(a.createdTime);
          });
        });
        setInput({ text: '', status: '' });
        setError((prevError) => ({ ...prevError, listPushArea: false })); // エラーをリセット
        return true; // 成功時に true を返す
      } catch (error) {
        console.error('Error adding todo:', error);
        setError((prevError) => ({ ...prevError, listPushArea: true })); // エラー表示
        return false;
      }
    } else {
      setError((prevError) => ({ ...prevError, listPushArea: true })); // エラー表示
      return false;
    }
  }, [input.text, input.status]);

  // todo削除
  const deleteTodo = useCallback(async (id: string) => {
    try {
      // client
      setTodos((prevTodos: TodoListProps[]) =>
        prevTodos.filter((todo) => todo.id !== id),
      ); // todo.id が id と一致しない todo だけを残す新しい配列を作成
      // server side
      await apiRequest<TodoPayload<'DELETE', true>, TodoResponse<'DELETE'>>(
        '/api/todos',
        'DELETE',
        { id },
      );
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  }, []);

  // 編集（モーダル内）
  const editTodo = useCallback(
    (id: string) => {
      const todoToEdit = todos.find((todo) => todo.id === id); // todo.id が指定された id と一致するかどうかをチェック
      if (todoToEdit) {
        setInput({
          ...input,
          text: todoToEdit.text,
          status: todoToEdit.status,
        });
        setEditId(id);
      }
    },
    [input, todos],
  );

  // 選択状態を切り替える関数
  const toggleSelected = useCallback(
    async (id: string) => {
      // 更新するboolの値を取得
      const todoToUpdate = todos.find((todo) => todo.id === id);
      if (todoToUpdate) {
        try {
          // client
          setTodos((prevTodos: TodoListProps[]) =>
            prevTodos.map((todo) =>
              todo.id === id ? { ...todo, bool: !todo.bool } : todo,
            ),
          );
          // server side
          await apiRequest<TodoPayload<'PUT', true>, TodoResponse<'PUT'>>(
            '/api/todos',
            'PUT',
            {
              id,
              bool: !todoToUpdate.bool,
            },
          );
        } catch (error) {
          console.error('Error puting toggle:', error);
        }
      }
    },
    [todos],
  );

  // 保存
  const saveTodo = useCallback(async () => {
    if (editId !== null) {
      // trueの場合
      const todoToUpdate = todos.find((todo) => todo.id === editId);
      if (todoToUpdate && input.text && input.status) {
        // 更新が必要か確認
        if (
          todoToUpdate.text === input.text &&
          todoToUpdate.status === input.status
        ) {
          // 不要な場合はtext,statusともに''に処理を終了する
          setInput({ text: '', status: '' });
          setEditId(null);
          return;
        }

        const updateTodo = {
          updateTime: jstTime().getTime().toString(),
          text: input.text,
          status: input.status,
        };

        try {
          // client
          setTodos((prevTodos: TodoListProps[]) => {
            const updatedTodos = prevTodos.map((todo) =>
              todo.id === editId
                ? ({
                    ...todo,
                    text: updateTodo.text,
                    status: updateTodo.status,
                    updateTime: todo.updateTime, // 既存の型を保持
                  } as TodoListProps)
                : todo,
            );
            return updatedTodos.sort((a, b) => {
              const getTime = (timestamp: unknown) => {
                if (typeof timestamp === 'number') return timestamp;
                if (
                  timestamp &&
                  typeof (timestamp as { toMillis?: () => number }).toMillis ===
                    'function'
                ) {
                  return (timestamp as { toMillis: () => number }).toMillis();
                }
                return parseInt(String(timestamp)) || 0;
              };
              return getTime(b.createdTime) - getTime(a.createdTime);
            });
          });
          // server side
          await apiRequest<TodoPayload<'PUT', true>, TodoResponse<'PUT'>>(
            '/api/todos',
            'PUT',
            {
              id: editId,
              ...updateTodo,
            },
          );

          setInput({ text: '', status: '' });
          setEditId(null);
          setError((prevError) => ({ ...prevError, listModalArea: false })); // エラーをリセット
        } catch (error) {
          console.error('Error saving todo:', error);
          setError((prevError) => ({ ...prevError, listModalArea: true })); // エラー表示
        }
      } else {
        setError((prevError) => ({ ...prevError, listModalArea: true })); // エラーを表示
        return;
      }
    }
  }, [editId, input.text, input.status, todos]);

  return {
    todos,
    input,
    editId,
    error,
    addTodoOpenStatus,
    setTodos,
    setEditId,
    addTodo,
    deleteTodo,
    editTodo,
    saveTodo,
    toggleSelected,
    setInput,
    setError,
    setAddTodoOpenStatus,
  };
};
