import { Blocks, ListTodo, Smartphone } from 'lucide-react';
import { k } from '@pkg/locales';
import type { Addon } from '@/lib/addon';
import { jobsRoutes } from './jobs';
import { mobileDemoRoutes } from './phone/routes';

/**
 * The demo add-on's part of the dashboard: the components showcase, the
 * example-jobs page and a phone-layout demo. A new project never keeps it
 * (`pnpm init:project` removes it; docs/addons.md).
 */
export const addon: Addon = {
  rootRoutes: mobileDemoRoutes,
  routes: [
    ...jobsRoutes,
    {
      path: 'components',
      lazy: () => import('./components.page').then((m) => ({ Component: m.default })),
    },
  ],
  links: [
    { titleKey: k.demo.jobs.jobs, url: '/jobs', icon: ListTodo, group: 'management' },
    { titleKey: k.common.nav.components, url: '/components', icon: Blocks },
    { titleKey: k.demo.phone, url: '/mobile', icon: Smartphone },
  ],
};
