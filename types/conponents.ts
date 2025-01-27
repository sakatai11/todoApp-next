import { TodoHookType } from '@/types/todos';
import { ListHookType } from '@/types/lists';
import {
  updateStatusAndCategoryHooks,
  deleteListHooks,
  EditDataProps,
} from '@/types/common';
import { Status } from '@/types/todos';

export type PushContainerType = {
  todoHooks: TodoHookType<EditDataProps>;
  statusPull: Status[];
  isEditing: boolean;
};

export type MainContainerProps = {
  todoHooks: TodoHookType<EditDataProps>;
  listHooks: ListHookType;
  updateStatusAndCategoryHooks: updateStatusAndCategoryHooks<EditDataProps>;
  deleteListHooks: deleteListHooks;
};
