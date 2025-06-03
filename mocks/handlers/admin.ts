// mocks/handlers/admin.ts
import { http, HttpResponse } from 'msw';
import { user } from '../data';
import { todos } from '../data/todos';
import { lists } from '../data/lists';

export const adminHandlers = [
  // Get all users
  http.get('/api/users', () => {
    return HttpResponse.json({
      users: user,
    });
  }),

  // Get user's todos
  http.get('/api/users/:userId/todos', ({ params }) => {
    const { userId } = params;

    // For mock, return all todos regardless of userId
    return HttpResponse.json({
      userId,
      todos: todos,
    });
  }),

  // Get user's lists
  http.get('/api/users/:userId/lists', ({ params }) => {
    const { userId } = params;

    // For mock, return all lists regardless of userId
    return HttpResponse.json({
      userId,
      lists: lists,
    });
  }),
];
