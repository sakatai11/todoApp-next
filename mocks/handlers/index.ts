// mocks/handlers/index.ts
import { todosHandlers } from './todos';
import { authHandlers } from './auth';
import { adminHandlers } from './admin';
import { dashboardHandlers } from './dashboard';
import { listsHandlers } from './lists';

export const handlers = [
  ...todosHandlers,
  ...authHandlers,
  ...adminHandlers,
  ...dashboardHandlers,
  ...listsHandlers,
];
