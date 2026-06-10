import type { RouteObject } from 'react-router';

/** Route subtree owned by the notifications feature, aggregated by the app router. */
export const notificationsRoutes: RouteObject[] = [
  {
    path: 'notifications',
    lazy: () => import('./notifications.page').then((m) => ({ Component: m.default })),
  },
];
