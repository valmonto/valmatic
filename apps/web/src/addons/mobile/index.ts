import { Smartphone } from 'lucide-react';
import { k } from '@pkg/locales';
import type { Addon } from '@/lib/addon';
import { mobileDemoRoutes } from './routes';

/**
 * The mobile add-on's part of the dashboard: a phone-layout demo of the app
 * at `/mobile`. Removed with the add-on (docs/addons.md).
 */
export const addon: Addon = {
  rootRoutes: mobileDemoRoutes,
  links: [{ titleKey: k.mobile.nav, url: '/mobile', icon: Smartphone }],
};
