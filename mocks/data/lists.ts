import { StatusListProps } from '@/types/lists';

const mockTodos: StatusListProps[] = [
  {
    id: 'list-1',
    category: 'in-progress',
    number: 1,
  },
  {
    id: 'list-2',
    category: 'done',
    number: 2,
  },
  {
    id: 'list-3',
    category: 'todo',
    number: 3,
  },
];

export const lists = [...mockTodos];
