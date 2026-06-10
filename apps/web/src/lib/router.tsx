import { createBrowserRouter, RouterProvider } from 'react-router';
import { mutate } from 'swr';
import { http } from '@/shared/api/http';
import { AUTH_ME_KEY } from '@/shared/auth/auth-context';
import { userRoutes } from '@/features/users';
import { jobsRoutes } from '@/features/jobs';
import { notificationsRoutes } from '@/features/notifications';
import { authRoutes } from '@/features/auth';

const router = createBrowserRouter([
  // Auth routes - no app layout (navbar, sidebar, etc.)
  ...authRoutes,
  // App routes - with main layout
  {
    path: '/',
    lazy: () => import('@/pages/~.app.page').then((m) => ({ Component: m.default })),
    children: [
      {
        index: true,
        lazy: () => import('@/pages/index.page').then((m) => ({ Component: m.default })),
      },
      ...userRoutes,
      ...jobsRoutes,
      ...notificationsRoutes,
      {
        path: 'settings',
        lazy: () => import('@/pages/settings.page').then((m) => ({ Component: m.default })),
      },
      {
        path: '*',
        lazy: () => import('@/pages/~404.page').then((m) => ({ Component: m.default })),
      },
    ],
  },
  // Root-level 404 catch-all (works without authentication)
  {
    path: '*',
    lazy: () => import('@/pages/~404.page').then((m) => ({ Component: m.default })),
  },
]);

// On an unrecoverable 401, drop the cached session and route to login WITHOUT a
// full-page reload, preserving SPA state. (Token refresh is handled server-side.)
http.setUnauthorizedHandler(() => {
  void mutate(AUTH_ME_KEY, null, { revalidate: false });
  void router.navigate('/auth/login');
});

export function AppRouter() {
  return <RouterProvider router={router} />;
}
