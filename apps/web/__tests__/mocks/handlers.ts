import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/auth/me', () => {
    return HttpResponse.json({
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
    });
  }),

  http.get('/api/users', () => {
    return HttpResponse.json({
      users: [
        { id: '1', email: 'user1@example.com', name: 'User One' },
        { id: '2', email: 'user2@example.com', name: 'User Two' },
      ],
    });
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };

    if (body.email === 'test@example.com' && body.password === 'password') {
      return HttpResponse.json({
        token: 'mock-token',
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
      });
    }

    return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ success: true });
  }),
];
