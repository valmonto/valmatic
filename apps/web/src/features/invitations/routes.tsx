import type { RouteObject } from 'react-router';

/**
 * Public accept route, spread at the TOP level of the router (sibling of the
 * auth routes) — deliberately NOT under the `/` app-shell layout, which gates
 * on authentication. A brand-new invitee with no account must be able to open
 * the raw link and complete signup; the page itself branches on session state.
 */
export const invitationRoutes: RouteObject[] = [
  {
    path: '/invite/:token',
    lazy: () => import('./accept-invite.page').then((m) => ({ Component: m.default })),
  },
];
