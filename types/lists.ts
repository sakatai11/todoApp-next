// todoデータの型
export type StatusListProps = {
  id: string;
  category: string;
  number: number;
};

// APIデータは動的に型定義
export type ListPayload<T extends 'POST' | 'DELETE' | 'PUT'> = T extends 'POST'
  ? Omit<StatusListProps, 'id'> // POSTではidを省略
  : T extends 'DELETE'
    ? Pick<StatusListProps, 'id'> // DELETEではidのみ必須
    : T extends 'PUT'
      ? Pick<StatusListProps, 'id' | 'category'>
      : never;
