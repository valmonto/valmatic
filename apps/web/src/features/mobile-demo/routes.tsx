import type { RouteObject } from 'react-router';

/**
 * Route subtree owned by the mobile-demo feature. Mounted at the router root
 * (outside the dashboard shell) so the phone layout owns the whole viewport.
 */
export const mobileDemoRoutes: RouteObject[] = [
  {
    path: '/mobile',
    lazy: () => import('./mobile-layout.page').then((m) => ({ Component: m.default })),
    children: [
      {
        index: true,
        lazy: () => import('./home.page').then((m) => ({ Component: m.default })),
      },
      {
        path: 'tasks',
        lazy: () => import('./tasks.page').then((m) => ({ Component: m.default })),
      },
      {
        path: 'tasks/:taskId',
        lazy: () => import('./task-detail.page').then((m) => ({ Component: m.default })),
      },
      {
        path: 'inbox',
        lazy: () => import('./inbox.page').then((m) => ({ Component: m.default })),
      },
      {
        path: 'profile',
        lazy: () => import('./profile.page').then((m) => ({ Component: m.default })),
      },
    ],
  },
];
