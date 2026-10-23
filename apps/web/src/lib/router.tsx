import { createBrowserRouter, RouterProvider } from 'react-router';
import { mutate } from 'swr';
import { http } from '@/shared/api/http';
import { AUTH_ME_KEY } from '@/shared/auth/auth-context';
import { userRoutes } from '@/features/users';
import { jobsRoutes } from '@/features/jobs';
import { notificationsRoutes } from '@/features/notifications';
import { authRoutes } from '@/features/auth';
import { adminRoutes } from '@/features/admin';
import { addons } from '@/addons.generated';
import { invitationRoutes } from '@/features/invitations';

const router = createBrowserRouter([
  // Auth routes - no app layout (navbar, sidebar, etc.)
  ...authRoutes,
  // Invitation accept - public, no app shell (a new invitee has no account yet)
  ...invitationRoutes,
  // Add-ons' full-viewport pages, no app shell (valmatic.json, docs/addons.md)
  ...addons.flatMap((addon) => addon.rootRoutes ?? []),
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
      ...adminRoutes,
      ...notificationsRoutes,
      ...addons.flatMap((addon) => addon.routes ?? []),
      {
        path: 'settings',
        lazy: () => import('@/pages/settings.page').then((m) => ({ Component: m.default })),
      },
      {
        path: 'components',
        lazy: () => import('@/pages/components.page').then((m) => ({ Component: m.default })),
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
