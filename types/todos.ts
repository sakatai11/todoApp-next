import { EditDataProps, BaseHookType } from '@/types/common';

// todoデータの型
export type TodoListProps = {
  id: string;
  updateTime: number;
  createdTime: number;
  text: string;
  status: string;
  bool: boolean;
};

// APIデータは動的に型定義
export type TodoPayload<T extends 'POST' | 'DELETE' | 'PUT'> = T extends 'POST'
  ? Omit<TodoListProps, 'id'> // POSTではidを省略
  : T extends 'DELETE'
    ? Pick<TodoListProps, 'id'> // DELETEではidのみ必須
    : T extends 'PUT'
      ?
          | Pick<TodoListProps, 'id' | 'bool'>
          | Pick<TodoListProps, 'id' | 'updateTime' | 'text' | 'status'>
          | {
              type: 'restatus';
              data: { oldStatus: string; status: string }; // リスト名を変更するときの型定義
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
    setTodos: (todos: TodoListProps[]) => void;
    addTodo: () => void;
    deleteTodo: (id: string) => void;
    editTodo: (id: string) => void;
    saveTodo: () => void;
    toggleSelected: (id: string) => void;
  };

// POST / PUT / DELETE、それぞれのメソッドに応じたレスポンス型を定義します。
export type TodoResponse<T extends 'POST' | 'PUT' | 'DELETE'> = T extends 'POST'
  ? {
      id?: string;
      text?: string;
      status?: string;
      bool?: boolean;
      createdTime?: number;
      updateTime?: number;
      error?: string;
    }
  : T extends 'PUT'
    ? {
        message?: string;
        error?: string;
      }
    : T extends 'DELETE'
      ? {
          message?: string;
          error?: string;
        }
      : never;
