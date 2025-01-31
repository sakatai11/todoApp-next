import { TodoHookType } from '@/types/todos';
import { ListHookType } from '@/types/lists';
import {
  UpdateStatusAndCategoryHooks,
  DeleteListHooks,
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
  updateStatusAndCategoryHooks: UpdateStatusAndCategoryHooks<EditDataProps>;
  deleteListHooks: DeleteListHooks;
};
