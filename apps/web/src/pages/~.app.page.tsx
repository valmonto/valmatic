import { Navigate, Outlet, useLocation } from 'react-router';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';
import { k } from '@pkg/locales';
import { useAuth } from '@/context/auth-context';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layouts/dashboard-layout';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Moon, RefreshCw, Sun } from 'lucide-react';
import { OrgSwitcher } from '@/components/features/org/org-switcher';
import { NotificationBell } from '@/components/features/notifications/notification-bell';
import { LanguageSwitcher } from '@/components/features/language-switcher';

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
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4!" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <OrgSwitcher />
            <Separator orientation="vertical" className="h-6" />
            <NotificationBell />
            <LanguageSwitcher />
            <Button variant="ghost" size="icon-sm" onClick={toggleTheme}>
              {theme === 'light' ? <Moon className="size-4" /> : <Sun className="size-4" />}
              <span className="sr-only">Toggle theme</span>
            </Button>
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
