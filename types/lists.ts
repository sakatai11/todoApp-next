import { DragEndEvent } from '@dnd-kit/core';

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

export type ListHookType = {
  lists: StatusListProps[];
  error: { addListNull: boolean; addListSame: boolean };
  setLists: (lists: StatusListProps[]) => void;
  addList: () => Promise<boolean>;
  setInput: (input: { status: string }) => void;
  setError: (error: { addListNull: boolean; addListSame: boolean }) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  handleButtonMove: (id: string, direction: 'right' | 'left') => void;
};
