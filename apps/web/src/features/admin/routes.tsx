import type { RouteObject } from 'react-router';

/**
 * The /admin subtree — platform-admin pages, lazy-loaded so none of this code
 * is in the main chunk. Pages gate themselves with <AdminGate> (rendering);
 * the API enforces @SystemRoles(ADMIN) regardless.
 */
export const adminRoutes: RouteObject[] = [
  {
    path: 'admin/orgs',
    lazy: () => import('./admin-orgs.page').then((m) => ({ Component: m.default })),
  },
  {
    path: 'admin/permissions',
    lazy: () => import('./admin-permissions.page').then((m) => ({ Component: m.default })),
  },
];
