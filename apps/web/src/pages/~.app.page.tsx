import { Navigate, Outlet, useLocation } from 'react-router';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';
import { k } from '@pkg/locales';
import { useAuth } from '@/shared/auth/auth-context';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layouts/dashboard-layout';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { useTheme } from '@/shared/components/theme-provider';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Moon, RefreshCw, Search, Sun } from 'lucide-react';
import { OrgSwitcher } from '@/features/org';
import { NotificationBell } from '@/features/notifications';
import { LanguageSwitcher } from '@/shared/components/language-switcher';
import { CommandMenu, openCommandMenu } from '@/shared/components/command-menu';

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <AlertTriangle className="size-12 text-destructive" />
      <h2 className="text-xl font-semibold">{t(k.common.somethingWentWrong)}</h2>
      <p className="text-muted-foreground text-center max-w-md">
        {error instanceof Error ? error.message : t(k.common.unexpectedError)}
      </p>
      <Button onClick={resetErrorBoundary} variant="outline">
        <RefreshCw className="size-4 mr-2" />
        {t(k.common.actions.tryAgain)}
      </Button>
    </div>
  );
}

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/users': 'Users',
  '/jobs': 'Jobs',
  '/notifications': 'Notifications',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
};

export default function AppLayout() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  const pageTitle = pageTitles[location.pathname] || 'Page';

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <CommandMenu />
      <SidebarInset className="md:peer-data-[variant=inset]:shadow-[0_1px_3px_rgba(16,18,28,0.05),0_16px_40px_-20px_rgba(16,18,28,0.18)] md:peer-data-[variant=inset]:ring-1 md:peer-data-[variant=inset]:ring-border/60 dark:md:peer-data-[variant=inset]:ring-white/[0.06]">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 rounded-t-xl border-b border-border/50 bg-background/70 px-3 backdrop-blur-xl transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-1.5">
            <SidebarTrigger className="-ml-0.5 text-muted-foreground" />
            <Separator orientation="vertical" className="mr-1 h-4!" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-sm font-medium">{pageTitle}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={openCommandMenu}
              className="group flex h-8 w-44 items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-2.5 text-sm text-muted-foreground transition-colors hover:border-border hover:bg-muted/70 lg:w-60"
            >
              <Search className="size-3.5 shrink-0" />
              <span className="hidden truncate md:inline">{t(k.common.command.search)}</span>
              <kbd className="ml-auto hidden items-center rounded bg-background px-1.5 py-0.5 font-mono text-[10px] leading-none text-muted-foreground/70 ring-1 ring-border/60 md:inline-flex">
                ⌘K
              </kbd>
            </button>
            <OrgSwitcher />
            <Separator orientation="vertical" className="mx-0.5 h-5" />
            <div className="flex items-center gap-0.5">
              <NotificationBell />
              <LanguageSwitcher />
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={toggleTheme}
              >
                {theme === 'light' ? <Moon className="size-4" /> : <Sun className="size-4" />}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
