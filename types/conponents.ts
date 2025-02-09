import { TodoListProps, TodoHookType } from '@/types/todos';
import { ListHookType } from '@/types/lists';
import {
  UpdateStatusAndCategoryHooks,
  DeleteListHooks,
  EditDataProps,
  StatusType,
  BaseHookType,
  IsModalBaseType,
  IsModalWithSelectType,
  IsModalWithDeleteType,
} from '@/types/common';

// context
export type TodoContextType = {
  todoHooks: TodoHookType<EditDataProps>;
  listHooks: ListHookType;
  updateStatusAndCategoryHooks: UpdateStatusAndCategoryHooks<EditDataProps>;
  deleteListHooks: DeleteListHooks;
};

export type ModalPropType = IsModalBaseType & {
  todo?: TodoListProps;
  id: string;
};

export type TodoPropsType = {
  todo: TodoListProps;
};

// setErrorの型定義を除外
export type PullDownPropsType = Omit<
  BaseHookType<{ status: string }, boolean>,
  'setError'
> & {
  pullDownList: StatusType[];
};

export type DeletePropType = IsModalBaseType &
  IsModalWithSelectType & {
    title?: string;
    onDelete: () => void;
  };

export type StatusTitlePropType = {
  id: string;
  title: string;
  listNumber: number;
};

// SelectListModal
export type HandleClickPropsType = IsModalWithDeleteType &
  IsModalWithSelectType & {
    id: string;
    listNumber: number;
    listLength: number;
    setTextRename: (textRename: boolean) => void;
  };
