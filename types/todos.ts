import { EditDataProps, BaseHookType } from '@/types/common';
import { Timestamp } from 'firebase-admin/firestore';

// todoデータの型
export type TodoListProps = {
  id: string;
  updateTime: Timestamp;
  createdTime: Timestamp;
  text: string;
  status: string;
  bool: boolean;
};

// TodoのAPIデータの型定義,mock用
export type MockTodoListProps = Omit<
  TodoListProps,
  'updateTime' | 'createdTime'
> & {
  updateTime: string;
  createdTime: string;
};

// APIデータは動的に型定義
export type TodoPayload<T extends 'POST' | 'DELETE' | 'PUT'> = T extends 'POST'
  ? {
      text: string;
      status: string;
      bool: boolean;
    }
  : T extends 'DELETE'
    ? { id: string }
    : T extends 'PUT'
      ?
          | { id: string; bool: boolean }
          | {
              id: string;
              text: string;
              status: string;
            }
          | {
              type: 'restatus';
              data: { oldStatus: string; status: string };
            }
      : never;

// TodoHooksの型定義
// 制約あり（より型安全）
export type TodoHookType<T extends EditDataProps> = T &
  BaseHookType<
    { text: string; status: string },
    { listPushArea: boolean; listModalArea: boolean }
  > & {
    todos: TodoListProps[];
    addTodoOpenStatus: string | null;
    setTodos: (todos: TodoListProps[]) => void;
    addTodo: () => Promise<boolean>;
    deleteTodo: (id: string) => void;
    editTodo: (id: string) => void;
    saveTodo: () => void;
    toggleSelected: (id: string) => void;
    setAddTodoOpenStatus: (status: string | null) => void;
  };

// POST / PUT / DELETE、それぞれのメソッドに応じたレスポンス型を定義します。
export type TodoResponse<T extends 'POST' | 'PUT' | 'DELETE'> = T extends 'POST'
  ? {
      id?: string;
      text?: string;
      status?: string;
      bool?: boolean;
      createdTime?: Timestamp;
      updateTime?: Timestamp;
      error?: string;
    }
  : T extends 'PUT'
    ? {
        id?: string;
        text?: string;
        status?: string;
        bool?: boolean;
        createdTime?: Timestamp;
        updateTime?: Timestamp;
        message?: string;
        error?: string;
      }
    : T extends 'DELETE'
      ? {
          message?: string;
          error?: string;
        }
      : never;
