// mocks/handlers/dashboard.ts
import { http, HttpResponse } from 'msw';
import { contents } from '../data';

export const dashboardHandlers = [
  // Get dashboard contents (todos and lists)
  http.get('/api/dashboards', () => {
    return HttpResponse.json({ contents });
  }),
];
