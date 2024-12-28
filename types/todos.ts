// statusのプルダウンの型
export type Status = {
  category: string;
};

// todoデータの型
export type TodoListProps = {
  id: string;
  time: number;
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
      ? Pick<TodoListProps, 'id'> & Partial<Pick<TodoListProps, 'bool'>> // PUTではidは必須、boolはオプション
      : never;
