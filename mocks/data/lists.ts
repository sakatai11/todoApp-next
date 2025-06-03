import { StatusListProps } from '@/types/lists';

const mockTodos: StatusListProps[] = [
  {
    id: 'list-1',
    category: 'in-progress',
    number: 1,
  },
  {
    id: 'list-2',
    category: 'in-progress',
    number: 2,
  },
  {
    id: 'list-3',
    category: 'done',
    number: 3,
  },
  {
    id: 'list-4',
    category: 'todo',
    number: 4,
  },
];

export const lists = [...mockTodos];
