// mocks/handlers/auth.ts
import { http, HttpResponse } from 'msw';
import { user } from '../data';

export const authHandlers = [
  // User info endpoint
  http.get('/api/user', () => {
    // モック環境では常にユーザー情報を返す
    console.log('Mock: /api/user called');

    // 実際のAPIと同じ形式で返す
    return HttpResponse.json({
      user: [...user], // 配列として返す
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

  // NextAuth session endpoint
  http.get('/api/auth/session', () => {
    // モック環境でのセッション情報（実際のauth.config.tsに合わせた形式）
    return HttpResponse.json({
      user: {
        id: user[0].id,
        email: user[0].email,
        customToken: '',
        role: user[0].role,
      },
      tokenExpiry: 3600,
      tokenIssuedAt: Math.floor(Date.now() / 1000),
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24時間後
    });
  }),
];
