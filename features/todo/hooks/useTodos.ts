'use client';

import { useState, useCallback } from 'react';
import { TodoListProps, TodoPayload, TodoResponse } from '@/types/todos';
import { apiRequest } from '@/features/libs/apis';
import { getTime } from '@/features/utils/dateUtils';
import { trimAllSpaces } from '@/features/utils/validationUtils';
import { useError } from '@/features/todo/contexts/ErrorContext';
import { ERROR_MESSAGES } from '@/constants/errorMessages';

export const useTodos = (initialTodos: TodoListProps[]) => {
  //
  // ***** state ******
  //
  const { showError } = useError(); // グローバルエラー（APIエラー等）
  const [todos, setTodos] = useState<TodoListProps[]>(initialTodos);
  const [input, setInput] = useState<{ text: string; status: string }>({
    text: '',
    status: '',
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<{
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
  const addTodo = useCallback(async (): Promise<boolean> => {
    // バリデーション（半角・全角スペースのみも含む）
    const trimmedText = trimAllSpaces(input.text);
    const trimmedStatus = trimAllSpaces(input.status);

    if (!trimmedText || !trimmedStatus) {
      setValidationError((prevError) => ({ ...prevError, listPushArea: true }));
      return false;
    }

    const newTodo = {
      text: trimmedText,
      bool: false,
      status: trimmedStatus,
    };

    try {
      // server side
      const result = await apiRequest<
        TodoPayload<'POST'>,
        TodoResponse<'POST'>
      >('/api/todos', 'POST', newTodo);

      // client
      setTodos((prevTodos: TodoListProps[]) => {
        const updatedTodos = [...prevTodos, result as TodoListProps];
        return updatedTodos.sort((a, b) => {
          return getTime(b.createdTime) - getTime(a.createdTime);
        });
      });
      setInput({ text: '', status: '' });
      setValidationError((prevError) => ({
        ...prevError,
        listPushArea: false,
      })); // バリデーションエラーをリセット
      return true; // 成功時に true を返す
    } catch (error) {
      console.error('Error adding todo:', error);
      showError(ERROR_MESSAGES.TODO.ADD_FAILED);
      return false;
    }
  }, [input.text, input.status, showError]);

  // todo削除
  const deleteTodo = useCallback(
    async (id: string): Promise<void> => {
      // ロールバック用に現在のデータを保存
      const previousTodos = todos;

      try {
        // client（楽観的更新）
        setTodos((prevTodos: TodoListProps[]) =>
          prevTodos.filter((todo) => todo.id !== id),
        ); // todo.id が id と一致しない todo だけを残す新しい配列を作成

        // server side
        await apiRequest<TodoPayload<'DELETE'>, TodoResponse<'DELETE'>>(
          '/api/todos',
          'DELETE',
          { id },
        );
      } catch (error) {
        console.error('Error deleting todo:', error);
        // ロールバック
        setTodos(previousTodos);
        showError(ERROR_MESSAGES.TODO.DELETE_FAILED);
      }
    },
    [todos, showError],
  );

  // 編集（モーダル内）
  const editTodo = useCallback(
    (id: string): void => {
      const todoToEdit = todos.find((todo) => todo.id === id); // todo.id が指定された id と一致するかどうかをチェック
      if (todoToEdit) {
        setInput({
          text: todoToEdit.text,
          status: todoToEdit.status,
        });
        setEditId(id);
      }
    },
    [todos],
  );

  // 選択状態を切り替える関数
  const toggleSelected = useCallback(
    async (id: string): Promise<void> => {
      // 更新するboolの値を取得
      const todoToUpdate = todos.find((todo) => todo.id === id);
      if (todoToUpdate) {
        // ロールバック用に現在のデータを保存
        const previousTodos = todos;

        try {
          // client（楽観的更新）
          setTodos((prevTodos: TodoListProps[]) =>
            prevTodos.map((todo) =>
              todo.id === id ? { ...todo, bool: !todo.bool } : todo,
            ),
          );

          // server side
          await apiRequest<TodoPayload<'PUT'>, TodoResponse<'PUT'>>(
            '/api/todos',
            'PUT',
            {
              id,
              bool: !todoToUpdate.bool,
            },
          );
        } catch (error) {
          console.error('Error puting toggle:', error);
          // ロールバック
          setTodos(previousTodos);
          showError(ERROR_MESSAGES.TODO.TOGGLE_FAILED);
        }
      }
    },
    [todos, showError],
  );

  // 保存
  const saveTodo = useCallback(async (): Promise<boolean> => {
    if (editId !== null) {
      // trueの場合
      const todoToUpdate = todos.find((todo) => todo.id === editId);

      // バリデーション（半角・全角スペースのみも含む）
      const trimmedText = trimAllSpaces(input.text);
      const trimmedStatus = trimAllSpaces(input.status);

      if (!todoToUpdate || !trimmedText || !trimmedStatus) {
        setValidationError((prevError) => ({
          ...prevError,
          listModalArea: true,
        }));
        return false;
      }

      // 更新が必要か確認
      if (
        todoToUpdate.text === trimmedText &&
        todoToUpdate.status === trimmedStatus
      ) {
        // 不要な場合はtext,statusともに''に処理を終了する
        setInput({ text: '', status: '' });
        setEditId(null);
        return false;
      }

      const updateTodo = {
        text: trimmedText,
        status: trimmedStatus,
      };

      try {
        // server side
        const result = await apiRequest<
          TodoPayload<'PUT'>,
          TodoResponse<'PUT'>
        >('/api/todos', 'PUT', {
          id: editId,
          ...updateTodo,
        });

        // client
        setTodos((prevTodos: TodoListProps[]) => {
          const updatedTodos = prevTodos.map((todo) =>
            todo.id === editId
              ? ({ ...todo, ...result } as TodoListProps)
              : todo,
          );
          return updatedTodos.sort((a, b) => {
            return getTime(b.createdTime) - getTime(a.createdTime);
          });
        });

        setInput({ text: '', status: '' });
        setEditId(null);
        setValidationError((prevError) => ({
          ...prevError,
          listModalArea: false,
        })); // バリデーションエラーをリセット
        return true;
      } catch (error) {
        console.error('Error saving todo:', error);
        // エラー時は状態更新していないためロールバック不要
        showError(ERROR_MESSAGES.TODO.UPDATE_FAILED);
        return false;
      }
    }
    return false;
  }, [editId, input.text, input.status, todos, setTodos, showError]);

  return {
    todos,
    input,
    editId,
    validationError,
    addTodoOpenStatus,
    setTodos,
    setEditId,
    addTodo,
    deleteTodo,
    editTodo,
    saveTodo,
    toggleSelected,
    setInput,
    setValidationError,
    setAddTodoOpenStatus,
  };
};
