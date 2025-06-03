// mocks/data/todos.ts
import { TodoListProps } from '@/types/todos';
import { Timestamp } from 'firebase-admin/firestore';

const mockTodos: TodoListProps[] = [
  {
    id: 'todo-1',
    updateTime: Timestamp.fromDate(new Date(1746271892078)),
    createdTime: Timestamp.fromDate(new Date(1746271892078)),
    text: 'Next.js App Routerの学習',
    status: 'in-progress',
    bool: true,
  },
  {
    id: 'todo-2',
    updateTime: Timestamp.fromDate(new Date(1744749991599)),
    createdTime: Timestamp.fromDate(new Date(1744749991599)),
    text: 'Nuxt3の学習',
    status: 'in-progress',
    bool: false,
  },
  {
    id: 'todo-3',
    updateTime: Timestamp.fromDate(new Date(1746100000000)),
    createdTime: Timestamp.fromDate(new Date(1746100000000)),
    text: 'MSWの実装',
    status: 'todo',
    bool: false,
  },
  {
    id: 'todo-4',
    updateTime: Timestamp.fromDate(new Date(1746050000000)),
    createdTime: Timestamp.fromDate(new Date(1746050000000)),
    text: 'TypeScript最適化',
    status: 'done',
    bool: true,
  },
];

export const todos = [...mockTodos];
