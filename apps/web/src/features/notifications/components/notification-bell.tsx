import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { k } from '@pkg/locales';
import { Bell, CheckCheck, X, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { Notification } from '@pkg/contracts';
import { cn } from '@/shared/lib/utils';
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadCount,
} from '../hooks/use-notifications';
import { formatTimeAgo } from '../lib/format-time-ago';

const typeIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
} as const;

const typeColors = {
  info: 'text-blue-500',
  success: 'text-green-500',
  warning: 'text-yellow-500',
  error: 'text-red-500',
} as const;

function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
  onNavigate,
}: {
  notification: Notification;
  onMarkRead: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onNavigate: (link: string) => void;
}) {
  const { t } = useTranslation();
  const Icon = typeIcons[notification.type];

  const handleClick = async () => {
    if (!notification.read) {
      await onMarkRead(notification.id);
    }
    if (notification.link) {
      onNavigate(notification.link);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group flex gap-3 rounded-lg p-3 transition-colors cursor-pointer hover:bg-muted/80',
        notification.read ? 'opacity-60' : 'bg-muted/50',
      )}
    >
      <div className={cn('mt-0.5 shrink-0', typeColors[notification.type])}>
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm font-medium', !notification.read && 'font-semibold')}>
          {notification.title}
        </p>
        {notification.message && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
            {notification.message}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {formatTimeAgo(notification.createdAt, t)}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        className="shrink-0 size-7 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notification.id);
        }}
      >
        <X className="size-3.5" />
        <span className="sr-only">{t(k.notifications.dismiss)}</span>
      </Button>
    </div>
  );
}

export function NotificationBell() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const { data: notifications, isLoading } = useNotifications(
    { skip: 0, limit: 20, unreadOnly: false },
    { enabled: open },
  );
  const { data: unreadData } = useUnreadCount();

  const { execute: markAsRead } = useMarkNotificationRead();
  const { execute: markAllAsRead } = useMarkAllNotificationsRead();
  const { execute: deleteNotification } = useDeleteNotification();

  const handleMarkRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
  };

  const handleNavigate = (link: string) => {
    setOpen(false);
    navigate(link);
  };

  const unreadCount = unreadData?.count ?? 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="relative">
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex size-[18px] items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white ring-2 ring-background">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className="sr-only">{t(k.notifications.notifications)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <PopoverHeader className="flex flex-row items-center justify-between border-b px-4 py-3">
          <PopoverTitle>{t(k.notifications.notifications)}</PopoverTitle>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="mr-1 size-3" />
              {t(k.notifications.markAllRead)}
            </Button>
          )}
        </PopoverHeader>
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : !notifications?.data.length ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="size-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">{t(k.notifications.empty.none)}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1 p-2">
              {notifications.data.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={handleMarkRead}
                  onDelete={handleDelete}
                  onNavigate={handleNavigate}
                />
              ))}
            </div>
          )}
        </div>
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => handleNavigate('/notifications')}
          >
            {t(k.notifications.viewAll)}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
