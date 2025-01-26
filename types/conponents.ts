import { TodoHookType } from '@/types/todos';
import { ListHookType } from '@/types/lists';
import {
  updateStatusAndCategoryHooks,
  deleteListHooks,
  EditDataProps,
} from '@/types/common';
import { Status } from '@/types/todos';

export type PushContainerType<T extends TodoHookType> = T & {
  statusPull: Status[];
  isEditing: boolean;
};

export type MainContainerProps = {
  todoHooks: TodoHookType;
  listHooks: ListHookType;
  updateStatusAndCategoryHooks: updateStatusAndCategoryHooks<EditDataProps>;
  deleteListHooks: deleteListHooks;
};
