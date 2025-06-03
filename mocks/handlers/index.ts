// mocks/handlers/index.ts
import { todosHandlers } from './todos';
import { authHandlers } from './auth';
import { dashboardHandlers } from './dashboard';
import { listsHandlers } from './lists';

// dashboard data
export const handlers = [
  ...todosHandlers,
  ...authHandlers,
  ...dashboardHandlers,
  ...listsHandlers,
];
