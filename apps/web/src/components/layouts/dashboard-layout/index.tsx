import { useTranslation } from 'react-i18next';
import { k } from '@pkg/locales';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { UserActionsDropdown } from './user-actions-dropdown';
import { useSystemRole } from '@/shared/hooks/use-permissions';
import { Link, useLocation } from 'react-router';
import {
  BarChart3,
  Building2,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users,
  Hexagon,
  ListTodo,
  Blocks,
  Smartphone,
} from 'lucide-react';

const navGroups = [
  {
    labelKey: k.common.nav.overview,
    items: [
      { titleKey: k.common.nav.dashboard, url: '/', icon: LayoutDashboard },
      { titleKey: k.common.nav.analytics, url: '/analytics', icon: BarChart3 },
    ],
  },
  {
    labelKey: k.common.nav.management,
    items: [
      { titleKey: k.users.users, url: '/users', icon: Users },
      { titleKey: k.jobs.jobs, url: '/jobs', icon: ListTodo },
      { titleKey: k.common.nav.settings, url: '/settings', icon: Settings },
    ],
  },
  {
    labelKey: k.common.nav.developer,
    items: [
      { titleKey: k.common.nav.components, url: '/components', icon: Blocks },
      { titleKey: k.common.nav.mobile, url: '/mobile', icon: Smartphone },
    ],
  },
];

// Platform pages exist only for platform admins. Hiding the group is
// rendering; the API enforces @SystemRoles(ADMIN) regardless.
const platformGroup = {
  labelKey: k.admin.platform,
  items: [
    { titleKey: k.admin.organizations, url: '/admin/orgs', icon: Building2 },
    { titleKey: k.admin.permissions, url: '/admin/permissions', icon: ShieldCheck },
  ],
};

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation();
  const location = useLocation();
  const pathname = location.pathname;
  const systemRole = useSystemRole();
  const groups = systemRole === 'ADMIN' ? [...navGroups, platformGroup] : navGroups;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="pb-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-sidebar-accent/60">
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/75 text-primary-foreground shadow-sm shadow-primary/30 ring-1 ring-white/15">
                  <Hexagon className="size-4" />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-semibold tracking-tight">
                    vboilerplate
                  </span>
                  <span className="truncate text-[11px] text-sidebar-foreground/45">
                    {t(k.common.nav.workspace)}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.labelKey}>
            <SidebarGroupLabel className="px-2 text-[11px] font-medium tracking-[0.08em] text-sidebar-foreground/45 uppercase">
              {t(group.labelKey)}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.items.map((item) => {
                  const isActive =
                    item.url === '/' ? pathname === '/' : pathname.startsWith(item.url);
                  return (
                    <SidebarMenuItem key={item.titleKey}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={t(item.titleKey)}>
                        <Link to={item.url}>
                          <item.icon />
                          <span>{t(item.titleKey)}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <UserActionsDropdown />
      </SidebarFooter>
    </Sidebar>
  );
}
