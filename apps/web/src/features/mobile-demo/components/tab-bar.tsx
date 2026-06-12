import { useState } from 'react';
import { NavLink } from 'react-router';
import { House, Inbox, Plus, SquareCheckBig, User, type LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useMobileDemoStore } from '../store';
import { NewTaskSheet } from './new-task-sheet';

interface TabItem {
  to: string;
  end?: boolean;
  label: string;
  icon: LucideIcon;
}

const leftTabs: TabItem[] = [
  { to: '/mobile', end: true, label: 'Home', icon: House },
  { to: '/mobile/tasks', label: 'Tasks', icon: SquareCheckBig },
];

const rightTabs: TabItem[] = [
  { to: '/mobile/inbox', label: 'Inbox', icon: Inbox },
  { to: '/mobile/profile', label: 'Profile', icon: User },
];

function Tab({ tab, badge }: { tab: TabItem; badge?: number }) {
  return (
    <NavLink
      to={tab.to}
      end={tab.end}
      className={({ isActive }) =>
        cn(
          'relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 transition-colors duration-200',
          isActive ? 'text-primary' : 'text-muted-foreground/70 hover:text-foreground',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span className="relative">
            <tab.icon className="size-[22px]" strokeWidth={isActive ? 2.25 : 1.75} />
            {badge !== undefined && badge > 0 && (
              <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold leading-none text-primary-foreground ring-2 ring-background">
                {badge}
              </span>
            )}
          </span>
          <span className={cn('text-[10px] leading-none', isActive ? 'font-semibold' : 'font-medium')}>
            {tab.label}
          </span>
        </>
      )}
    </NavLink>
  );
}

/**
 * Bottom tab bar: two tabs each side of a raised "+" action that opens the
 * new-task sheet. Blurred translucent surface with a home-indicator bar, the
 * way native tab bars read.
 */
export function TabBar() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const unreadCount = useMobileDemoStore(
    (state) => state.notifications.filter((notification) => !notification.read).length,
  );

  return (
    <>
      <nav className="absolute inset-x-0 bottom-0 z-40 border-t border-border/50 bg-background/85 backdrop-blur-xl">
        <div className="flex items-center px-3 pt-1.5">
          {leftTabs.map((tab) => (
            <Tab key={tab.to} tab={tab} />
          ))}
          <div className="flex flex-1 justify-center">
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              aria-label="New task"
              className="-mt-5 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground bg-[linear-gradient(180deg,rgba(255,255,255,0.2),rgba(255,255,255,0)_50%)] shadow-[0_8px_20px_-6px_var(--primary),inset_0_1px_0_rgba(255,255,255,0.25)] ring-1 ring-white/15 transition-transform duration-150 active:scale-95"
            >
              <Plus className="size-6" strokeWidth={2.25} />
            </button>
          </div>
          {rightTabs.map((tab) => (
            <Tab key={tab.to} tab={tab} badge={tab.to === '/mobile/inbox' ? unreadCount : undefined} />
          ))}
        </div>
        <div className="flex justify-center pt-1 pb-2">
          <div className="h-1 w-28 rounded-full bg-foreground/20" />
        </div>
      </nav>

      <NewTaskSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}
