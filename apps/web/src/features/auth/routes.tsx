import type { RouteObject } from 'react-router';
import { REGISTRATION_ENABLED } from '@/shared/lib/registration';

/**
 * The full `/auth` route subtree (its own layout, no app navbar/sidebar) owned
 * by the auth feature and aggregated at the top level of the app router.
 */
export const authRoutes: RouteObject[] = [
  {
    path: '/auth',
    lazy: () => import('./auth-layout.page').then((m) => ({ Component: m.default })),
    children: [
      {
        path: 'login',
        lazy: () => import('./login.page').then((m) => ({ Component: m.default })),
      },
      // Rendered only when this deployment offers open signup; the API
      // enforces its own flag either way.
      ...(REGISTRATION_ENABLED
        ? [
            {
              path: 'register',
              lazy: () => import('./register.page').then((m) => ({ Component: m.default })),
            },
          ]
        : []),
    ],
  },
];
