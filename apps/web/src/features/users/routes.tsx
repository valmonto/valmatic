import type { RouteObject } from 'react-router';

/**
 * Route subtree owned by the users feature. The app router aggregates these
 * (`children: [...userRoutes]`) instead of hand-registering each path, so
 * adding a users route never touches the central router file.
 */
export const userRoutes: RouteObject[] = [
  {
    path: 'users',
    lazy: () => import('./users.page').then((m) => ({ Component: m.default })),
  },
];
