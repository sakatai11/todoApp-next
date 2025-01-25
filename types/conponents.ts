import { TodoHookType } from '@/types/todos';
import { Status } from '@/types/todos';

export type PushContainerType<T extends TodoHookType> = T & {
  statusPull: Status[];
  isEditing: boolean;
};
