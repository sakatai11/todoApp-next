import { DragEndEvent } from '@dnd-kit/core';
import { BaseHookType } from '@/types/common';

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
      ?
          | {
              type: 'reorder';
              data: string[]; // 新しい順序のID配列
            }
          | {
              type: 'update';
              id: string;
              data: Partial<Pick<StatusListProps, 'category'>>;
            }
      : never;

// ListHooksの型定義
export type ListHookType = BaseHookType<
  { status: string },
  { addListNull: boolean; addListSame: boolean }
> & {
  lists: StatusListProps[];
  setLists: (lists: StatusListProps[]) => void;
  addList: () => Promise<boolean>;
  handleDragEnd: (event: DragEndEvent) => void;
  handleButtonMove: (id: string, direction: 'right' | 'left') => void;
};
