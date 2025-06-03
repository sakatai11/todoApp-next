// mocks/handlers/auth.ts
import { http, HttpResponse } from 'msw';
import { user } from '../data';

export const authHandlers = [
  // User info endpoint
  http.get('/api/user', () => {
    return HttpResponse.json({
      id: user[0].id,
      email: user[0].email,
      role: user[0].role,
      createdAt: user[0].createdAt,
    });
  }),

  // Server login endpoint
  http.post('/api/auth/server-login', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    const { email, password } = body;

    // Simple mock authentication
    if (email && password) {
      return HttpResponse.json({
        success: true,
        user: {
          id: user[0].id,
          email: user[0].email,
          role: user[0].role,
        },
      });
    }

    return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }),

  // Token refresh endpoint
  http.post('/api/auth/refresh', async () => {
    // Mock token refresh
    return HttpResponse.json({
      success: true,
      token: 'new-mock-token',
    });
  }),
];
