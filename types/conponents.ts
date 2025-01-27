import { TodoHookType } from '@/types/todos';
import { ListHookType } from '@/types/lists';
import {
  updateStatusAndCategoryHooks,
  deleteListHooks,
  EditDataProps,
} from '@/types/common';
import { Status } from '@/types/todos';

// 制約あり（より型安全）
export type PushContainerType = {
  todoHooks: TodoHookType;
  statusPull: Status[];
  isEditing: boolean;
};

export type MainContainerProps = {
  todoHooks: TodoHookType;
  listHooks: ListHookType;
  updateStatusAndCategoryHooks: updateStatusAndCategoryHooks<EditDataProps>;
  deleteListHooks: deleteListHooks;
};
