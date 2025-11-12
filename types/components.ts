import { TodoListProps, TodoHookType } from '@/types/todos';
import { ListHookType } from '@/types/lists';
import { UserData } from '@/types/auth/authData';

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

// TodoList
export type TodoPropsType = {
  todo: TodoListProps;
};

// StatusPullList
// setValidationErrorの型定義を除外
export type PullDownPropsType = Omit<
  BaseHookType<{ status: string }, boolean>,
  'setValidationError'
> & {
  pullDownList: StatusType[];
};

// EditModal
export type ModalPropType = IsModalBaseType & {
  todo?: TodoListProps;
  id: string;
};

// DeleteModal
export type DeletePropType = IsModalBaseType &
  IsModalWithSelectType & {
    title?: string;
    onDelete: () => void;
  };

// SelectListModal
export type HandleClickPropsType = IsModalWithDeleteType &
  IsModalWithSelectType & {
    id: string;
    listNumber: number;
    listLength: number;
    setTextRename: (textRename: boolean) => void;
  };

// signOutModal
export type SignOutPropType = IsModalBaseType & {
  onSignOut: () => void;
};

// StatusTitle
export type StatusTitlePropType = {
  id: string;
  title: string;
  listNumber: number;
};

// NavigationContents
export type NavigationContentsProps = IsModalBaseType & {
  user: UserData;
  initial: string;
  onCloseNav: () => void;
};
