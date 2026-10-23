import { Link, Outlet, useLocation } from 'react-router';
import { ArrowLeft, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/shared/components/theme-provider';
import { StatusBar } from './components/status-bar';
import { TabBar } from './components/tab-bar';

/**
 * Mobile demo shell. On desktop the app renders inside a phone frame (bezel,
 * dynamic island, simulated status bar) centered on the canvas, with the
 * preview controls living outside the device. On real small screens the frame
 * disappears and the demo runs full-bleed, so it doubles as an actual mobile
 * layout. Everything inside is demo data — no API calls.
 */
export default function MobileLayout() {
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-sidebar lg:gap-5 lg:py-8">
      {/* Desktop-only preview chrome, outside the device */}
      <div className="hidden w-[390px] items-center justify-between lg:flex">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <Link to="/">
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>
        </Button>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground/70">Mobile preview</span>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            onClick={toggleTheme}
          >
            {theme === 'light' ? <Moon className="size-4" /> : <Sun className="size-4" />}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>

      {/* The device */}
      <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-background lg:h-[780px] lg:max-h-[calc(100svh-7rem)] lg:w-[390px] lg:rounded-[3rem] lg:border-[6px] lg:border-zinc-950 lg:shadow-[0_24px_60px_-16px_rgba(16,18,28,0.45)] lg:ring-1 lg:ring-black/20 dark:lg:border-zinc-800">
        <div className="hidden lg:block">
          <StatusBar />
        </div>

        {/* Real-mobile-only exit bar — desktop has the control outside the frame */}
        <div className="flex shrink-0 items-center justify-between border-b border-border/40 px-4 py-2 lg:hidden">
          <Link
            to="/"
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Exit preview
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            className="text-muted-foreground"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="size-4" /> : <Sun className="size-4" />}
          </button>
        </div>

        <main
          key={pathname}
          className="no-scrollbar flex-1 overflow-y-auto px-5 pt-3 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <Outlet />
        </main>

        <TabBar />
      </div>
    </div>
  );
}
