import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Bell, CheckCheck, Trash2, AlertCircle, Info, CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { k } from '@pkg/locales';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/api';
import { useCachedRequest } from '@/hooks/use-cached-request';
import { useActionRequest } from '@/hooks/use-action-request';
import type { ListNotificationsResponse, Notification } from '@pkg/contracts';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'unread' | 'read';

const typeIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
} as const;

const typeStyles = {
  info: {
    icon: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/50',
    border: 'border-blue-100 dark:border-blue-900/50',
  },
  success: {
    icon: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    border: 'border-emerald-100 dark:border-emerald-900/50',
  },
  warning: {
    icon: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    border: 'border-amber-100 dark:border-amber-900/50',
  },
  error: {
    icon: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/50',
    border: 'border-red-100 dark:border-red-900/50',
  },
} as const;

function formatTimeAgo(dateString: string, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t(k.notifications.time.justNow);
  if (diffMins < 60) return t(k.notifications.time.minutesAgo, { count: diffMins });
  if (diffHours < 24) return t(k.notifications.time.hoursAgo, { count: diffHours });
  if (diffDays < 7) return t(k.notifications.time.daysAgo, { count: diffDays });
  return date.toLocaleDateString();
}

function NotificationRow({
  notification,
  onMarkRead,
  onDelete,
  onNavigate,
  isDeleting,
}: {
  notification: Notification;
  onMarkRead: (id: string) => Promise<void>;
  onDelete: (id: string) => void;
  onNavigate: (link: string) => void;
  isDeleting?: boolean;
}) {
  const { t } = useTranslation();
  const Icon = typeIcons[notification.type];
  const styles = typeStyles[notification.type];
  const hasLink = !!notification.link;

  const handleClick = async () => {
    if (isDeleting || !hasLink) return;
    if (!notification.read) {
      await onMarkRead(notification.id);
    }
    onNavigate(notification.link!);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group relative flex items-start gap-4 rounded-lg border p-4 transition-all duration-300',
        hasLink && !isDeleting && 'cursor-pointer hover:shadow-sm hover:border-primary/30',
        !notification.read
          ? cn(styles.bg, styles.border)
          : 'bg-card border-border hover:bg-muted/30',
        isDeleting && 'opacity-0 scale-95 -translate-x-4 pointer-events-none'
      )}
    >
      {!notification.read && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-primary" />
      )}
      <div
        className={cn(
          'mt-0.5 shrink-0 rounded-full p-2',
          !notification.read ? styles.icon : 'text-muted-foreground bg-muted'
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              'text-sm leading-tight',
              !notification.read ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'
            )}
          >
            {notification.title}
          </p>
          {!notification.read && (
            <Badge variant="default" className="h-4 px-1.5 text-[10px]">
              {t(k.notifications.new)}
            </Badge>
          )}
        </div>
        {notification.message && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {notification.message}
          </p>
        )}
        <div className="mt-2 flex items-center gap-2">
          <p className="text-xs text-muted-foreground/70">
            {formatTimeAgo(notification.createdAt, t)}
          </p>
          {hasLink && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-xs text-primary/70 group-hover:text-primary transition-colors">
                {t(k.notifications.viewDetails)}
              </span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {hasLink && (
          <div className="text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all">
            <ChevronRight className="size-5" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
        >
          <Trash2 className="size-4" />
          <span className="sr-only">{t(k.common.actions.delete)}</span>
        </Button>
      </div>
    </div>
  );
}

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-4 rounded-lg border p-4">
      <Skeleton className="size-8 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

function NotificationListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[...Array(4)].map((_, i) => (
        <NotificationSkeleton key={i} />
      ))}
    </div>
  );
}

const filterKeys = {
  all: k.notifications.all,
  unread: k.notifications.unread,
  read: k.notifications.read,
} as const;

export default function NotificationsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>('all');
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const deleteTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const listFetcher = useCallback(
    () => api.notifications.list({ skip: 0, limit: 50, unreadOnly: false }),
    []
  );

  const {
    data: notifications,
    isLoading,
    mutate: mutateList,
  } = useCachedRequest<ListNotificationsResponse>({
    key: '/api/notifications',
    fetcher: listFetcher,
  });

  const { execute: markAsRead } = useActionRequest(api.notifications.markAsRead);
  const { execute: markAllAsRead } = useActionRequest(() => api.notifications.markAllAsRead());
  const { execute: deleteNotification } = useActionRequest(api.notifications.delete);
  const { execute: deleteAllNotifications } = useActionRequest(() => api.notifications.deleteAll());

  const handleMarkRead = async (id: string) => {
    const { e } = await markAsRead(id);
    if (!e) {
      await mutateList(undefined, { revalidate: true });
    }
  };

  const handleMarkAllRead = async () => {
    const { e } = await markAllAsRead(undefined);
    if (!e) {
      await mutateList(undefined, { revalidate: true });
    }
  };

  const handleClearAll = async () => {
    const { e, d } = await deleteAllNotifications(undefined);
    if (!e) {
      await mutateList(undefined, { revalidate: true });
      toast.success(t(k.notifications.clearedCount, { count: d?.count ?? 0 }));
    }
  };

  const handleDelete = (id: string) => {
    // Mark as deleting (triggers animation)
    setDeletingIds((prev) => new Set(prev).add(id));

    // Clear any existing timeout for this id
    const existingTimeout = deleteTimeouts.current.get(id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Show toast with undo
    toast(t(k.notifications.deleted), {
      icon: <Trash2 className="size-4" />,
      action: {
        label: t(k.notifications.undo),
        onClick: () => {
          // Cancel the deletion
          const timeout = deleteTimeouts.current.get(id);
          if (timeout) {
            clearTimeout(timeout);
            deleteTimeouts.current.delete(id);
          }
          setDeletingIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        },
      },
      duration: 5000,
    });

    // Schedule actual deletion after animation + undo window
    const timeout = setTimeout(async () => {
      const { e } = await deleteNotification(id);
      if (!e) {
        await mutateList(undefined, { revalidate: true });
      }
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      deleteTimeouts.current.delete(id);
    }, 5000);

    deleteTimeouts.current.set(id, timeout);
  };

  const handleNavigate = (link: string) => {
    navigate(link);
  };

  const allNotifications = notifications?.data ?? [];
  const activeNotifications = allNotifications.filter((n) => !deletingIds.has(n.id));
  const unreadCount = activeNotifications.filter((n) => !n.read).length;

  const filteredNotifications = allNotifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  const getFilterCount = (f: FilterType) => {
    // Exclude deleting notifications from counts
    const active = allNotifications.filter((n) => !deletingIds.has(n.id));
    if (f === 'all') return active.length;
    if (f === 'unread') return active.filter((n) => !n.read).length;
    return active.filter((n) => n.read).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t(k.notifications.notifications)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount > 0 ? (
              t(k.notifications.unreadCount, { count: unreadCount })
            ) : (
              t(k.notifications.allCaughtUp)
            )}
          </p>
        </div>
        {allNotifications.length > 0 && (
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                <CheckCheck className="mr-2 size-4" />
                {t(k.notifications.markAllRead)}
              </Button>
            )}
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={handleClearAll}>
              <Trash2 className="mr-2 size-4" />
              {t(k.notifications.clearAll)}
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {(['all', 'unread', 'read'] as FilterType[]).map((filterValue) => {
          const count = getFilterCount(filterValue);
          const isActive = filter === filterValue;
          return (
            <Button
              key={filterValue}
              variant={isActive ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter(filterValue)}
              className={cn(
                'gap-1.5',
                !isActive && 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t(filterKeys[filterValue])}
              <span
                className={cn(
                  'min-w-5 rounded-full px-1.5 py-0.5 text-xs font-medium',
                  isActive
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {count}
              </span>
            </Button>
          );
        })}
      </div>

      {isLoading && !notifications ? (
        <NotificationListSkeleton />
      ) : !filteredNotifications.length ? (
        <Empty className="py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Bell className="size-5" />
            </EmptyMedia>
            <EmptyTitle>
              {filter === 'all' && t(k.notifications.empty.none)}
              {filter === 'unread' && t(k.notifications.empty.noUnread)}
              {filter === 'read' && t(k.notifications.empty.noRead)}
            </EmptyTitle>
            <EmptyDescription>
              {filter === 'all' && t(k.notifications.empty.description)}
              {filter === 'unread' && t(k.notifications.empty.allCaughtUpDesc)}
              {filter === 'read' && t(k.notifications.empty.noReadYet)}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredNotifications.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              onMarkRead={handleMarkRead}
              onDelete={handleDelete}
              onNavigate={handleNavigate}
              isDeleting={deletingIds.has(notification.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
