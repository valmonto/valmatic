import { createBrowserRouter, RouterProvider } from 'react-router';

const router = createBrowserRouter([
  // Auth routes - no app layout (navbar, sidebar, etc.)
  {
    path: '/auth',
    lazy: () => import('@/pages/~.auth.page').then((m) => ({ Component: m.default })),
    children: [
      {
        path: 'login',
        lazy: () => import('@/pages/auth/login.page').then((m) => ({ Component: m.default })),
      },
      {
        path: 'register',
        lazy: () => import('@/pages/auth/register.page').then((m) => ({ Component: m.default })),
      },
    ],
  },
  // App routes - with main layout
  {
    path: '/',
    lazy: () => import('@/pages/~.app.page').then((m) => ({ Component: m.default })),
    children: [
      {
        index: true,
        lazy: () => import('@/pages/index.page').then((m) => ({ Component: m.default })),
      },
      {
        path: 'users',
        lazy: () => import('@/pages/users.page').then((m) => ({ Component: m.default })),
      },
      {
        path: 'settings',
        lazy: () => import('@/pages/settings.page').then((m) => ({ Component: m.default })),
      },
      {
        path: 'jobs',
        lazy: () => import('@/pages/jobs.page').then((m) => ({ Component: m.default })),
      },
      {
        path: 'notifications',
        lazy: () => import('@/pages/notifications.page').then((m) => ({ Component: m.default })),
      },
      {
        path: 'error-test',
        lazy: () => import('@/pages/error-test.page').then((m) => ({ Component: m.default })),
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

export function AppRouter() {
  return <RouterProvider router={router} />;
}
