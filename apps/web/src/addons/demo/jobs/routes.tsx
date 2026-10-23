import type { RouteObject } from 'react-router';

/** Route subtree owned by the jobs feature, aggregated by the app router. */
export const jobsRoutes: RouteObject[] = [
  {
    path: 'jobs',
    lazy: () => import('./jobs.page').then((m) => ({ Component: m.default })),
  },
];
