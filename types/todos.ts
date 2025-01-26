import { EditDataProps } from '@/types/common';

// statusのプルダウンの型
export type Status = {
  category: string;
};

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
          | { oldStatus: string; status: string } // リスト名を変更するときの型定義
      : never;

// TodoHooksの型定義
export type TodoHookType = {
  todos: TodoListProps[];
  input: { text: string; status: string };
  // editId: string | null;
  error: { listPushArea: boolean; listModalArea: boolean };
  setTodos: (todos: TodoListProps[]) => void;
  // setEditId: (id: string | null) => void;
  addTodo: () => void;
  deleteTodo: (id: string) => void;
  editTodo: (id: string) => void;
  saveTodo: () => void;
  toggleSelected: (id: string) => void;
  setInput: (input: { text: string; status: string }) => void;
  setError: (error: { listPushArea: boolean; listModalArea: boolean }) => void;
} & EditDataProps;
