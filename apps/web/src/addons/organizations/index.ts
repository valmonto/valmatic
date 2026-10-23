import { Building2 } from 'lucide-react';
import { k } from '@pkg/locales';
import type { Addon } from '@/lib/addon';
import { OrgSwitcher } from './org';

/**
 * The `organizations` add-on's part of the dashboard: the organization
 * switcher (with "create organization") in the top bar, and the platform
 * admin's list of every organization (docs/addons.md).
 */
export const addon: Addon = {
  headerItems: [OrgSwitcher],
  routes: [
    {
      path: 'admin/orgs',
      lazy: () => import('./admin-orgs.page').then((m) => ({ Component: m.default })),
    },
  ],
  links: [
    { titleKey: k.admin.organizations, url: '/admin/orgs', icon: Building2, group: 'platform' },
  ],
};
