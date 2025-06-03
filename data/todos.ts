// mocks/data/todos.ts
import { MockTodoListProps } from '@/types/todos';

const mockTodos: MockTodoListProps[] = [
  {
    id: 'todo-1',
    updateTime: new Date(1746271892078).toISOString(),
    createdTime: new Date(1746271892078).toISOString(),
    text: 'Next.js App Routerの学習',
    status: 'in-progress',
    bool: true,
  },
  {
    id: 'todo-2',
    updateTime: new Date(1744749991599).toISOString(),
    createdTime: new Date(1744749991599).toISOString(),
    text: 'Nuxt3の学習',
    status: 'in-progress',
    bool: false,
  },
  {
    id: 'todo-3',
    updateTime: new Date(1746100000000).toISOString(),
    createdTime: new Date(1746100000000).toISOString(),
    text: 'MSWの実装',
    status: 'todo',
    bool: false,
  },
  {
    id: 'todo-4',
    updateTime: new Date(1746050000000).toISOString(),
    createdTime: new Date(1746050000000).toISOString(),
    text: 'TypeScript最適化',
    status: 'done',
    bool: true,
  },
];

export const todos = [...mockTodos];
