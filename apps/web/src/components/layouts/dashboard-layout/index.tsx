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
  SidebarRail,
} from '@/components/ui/sidebar';
import { UserActionsDropdown } from './user-actions-dropdown';
import { Link, useLocation } from 'react-router';
import { BarChart3, Bug, LayoutDashboard, Settings, Users, Hexagon, ListTodo } from 'lucide-react';

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
    items: [{ titleKey: k.common.nav.errorTest, url: '/error-test', icon: Bug }],
  },
];

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation();
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Hexagon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">vboilerplate</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {t(k.common.nav.dashboard)}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.labelKey}>
            <SidebarGroupLabel>{t(group.labelKey)}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
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
      <SidebarRail />
    </Sidebar>
  );
}
