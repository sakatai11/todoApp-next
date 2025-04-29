import { Timestamp } from 'firebase-admin/firestore';
import { TodoListProps } from '@/types/todos';
import { StatusListProps } from '@/types/lists';
// tokenRoleのリテラル型
export type UserRole = 'ADMIN' | 'USER';

// ユーザーデータの型定義
export type UserData = {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Timestamp;
  name?: string;
  image?: string;
  updatedAt?: Timestamp;
};

// ユーザーデータの拡張型定義
export type EnhancedUserData = UserData & {
  todos: TodoListProps[];
  lists: StatusListProps[];
};
