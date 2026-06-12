import { AtSign, CheckCheck, Inbox, MessageSquare, Rocket, Settings2, type LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useMobileDemoStore, type DemoNotification, type DemoNotificationKind } from './store';

const kindMeta: Record<DemoNotificationKind, { icon: LucideIcon; className: string }> = {
  mention: { icon: AtSign, className: 'bg-primary/10 text-primary' },
  comment: { icon: MessageSquare, className: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' },
  success: { icon: Rocket, className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  system: { icon: Settings2, className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
};

function NotificationRow({ notification }: { notification: DemoNotification }) {
  const markRead = useMobileDemoStore((state) => state.markNotificationRead);
  const meta = kindMeta[notification.kind];

  return (
    <button
      type="button"
      onClick={() => markRead(notification.id)}
      className={cn(
        'flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition-all duration-200 active:scale-[0.985]',
        notification.read
          ? 'border-border/50 bg-card/50'
          : 'border-border/60 bg-card shadow-[0_1px_2px_rgba(16,18,28,0.04)]',
      )}
    >
      <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full', meta.className)}>
        <meta.icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span
            className={cn(
              'truncate text-[13px]',
              notification.read ? 'font-medium text-muted-foreground' : 'font-semibold',
            )}
          >
            {notification.title}
          </span>
          <span className="ml-auto shrink-0 text-[11px] text-muted-foreground/70">
            {notification.time}
          </span>
          {!notification.read && <span className="size-2 shrink-0 rounded-full bg-primary" />}
        </span>
        <span
          className={cn(
            'mt-0.5 line-clamp-2 text-xs leading-relaxed',
            notification.read ? 'text-muted-foreground/70' : 'text-muted-foreground',
          )}
        >
          {notification.body}
        </span>
      </span>
    </button>
  );
}

export default function MobileInboxPage() {
  const notifications = useMobileDemoStore((state) => state.notifications);
  const markAllRead = useMobileDemoStore((state) => state.markAllNotificationsRead);

  const unread = notifications.filter((notification) => !notification.read).length;
  const todayItems = notifications.filter((notification) => notification.today);
  const earlierItems = notifications.filter((notification) => !notification.today);

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between pt-2">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Inbox</h1>
          <p className="text-[13px] text-muted-foreground">
            {unread > 0 ? `${unread} unread` : 'All caught up'}
          </p>
        </div>
        {unread > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
          >
            <CheckCheck className="size-3.5" />
            Mark all read
          </button>
        )}
      </header>

      {notifications.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border/70 py-12 text-center">
          <Inbox className="mx-auto mb-2 size-8 text-muted-foreground/40" />
          <p className="text-sm font-medium">Inbox zero</p>
        </div>
      )}

      {todayItems.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground/70 uppercase">
            Today
          </h2>
          <div className="space-y-2">
            {todayItems.map((notification) => (
              <NotificationRow key={notification.id} notification={notification} />
            ))}
          </div>
        </section>
      )}

      {earlierItems.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground/70 uppercase">
            Earlier
          </h2>
          <div className="space-y-2">
            {earlierItems.map((notification) => (
              <NotificationRow key={notification.id} notification={notification} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
