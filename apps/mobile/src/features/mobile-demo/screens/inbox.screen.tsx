import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from '@/shared/components/safe-area-view';
import {
  AtSign,
  CheckCheck,
  Inbox,
  MessageSquare,
  Rocket,
  Settings2,
  type LucideIcon,
} from 'lucide-react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import {
  useMobileDemoStore,
  type DemoNotification,
  type DemoNotificationKind,
} from '../store';

const kindMeta: Record<DemoNotificationKind, { icon: LucideIcon; bg: string; fg: string }> = {
  mention: { icon: AtSign, bg: 'bg-primary/10', fg: 'text-primary' },
  comment: { icon: MessageSquare, bg: 'bg-sky-500/10', fg: 'text-sky-500' },
  success: { icon: Rocket, bg: 'bg-emerald-500/10', fg: 'text-emerald-500' },
  system: { icon: Settings2, bg: 'bg-amber-500/10', fg: 'text-amber-500' },
};

function NotificationRow({ notification }: { notification: DemoNotification }) {
  const markRead = useMobileDemoStore((s) => s.markNotificationRead);
  const meta = kindMeta[notification.kind];
  return (
    <Pressable
      onPress={() => markRead(notification.id)}
      className={cn(
        'flex-row items-start gap-3 rounded-2xl border p-3.5 active:opacity-80',
        notification.read ? 'border-border bg-card/50' : 'border-border bg-card shadow-sm shadow-black/5'
      )}
    >
      <View className={cn('h-9 w-9 items-center justify-center rounded-full', meta.bg)}>
        <Icon as={meta.icon} size={16} className={meta.fg} />
      </View>
      <View className="min-w-0 flex-1">
        <View className="flex-row items-center gap-2">
          <Text
            numberOfLines={1}
            className={cn(
              'flex-1 text-[13px]',
              notification.read ? 'font-medium text-muted-foreground' : 'font-semibold text-foreground'
            )}
          >
            {notification.title}
          </Text>
          <Text className="text-[11px] text-muted-foreground/70">{notification.time}</Text>
          {!notification.read ? <View className="h-2 w-2 rounded-full bg-primary" /> : null}
        </View>
        <Text
          numberOfLines={2}
          className={cn(
            'mt-0.5 text-xs leading-relaxed',
            notification.read ? 'text-muted-foreground/70' : 'text-muted-foreground'
          )}
        >
          {notification.body}
        </Text>
      </View>
    </Pressable>
  );
}

function Section({ title, items }: { title: string; items: DemoNotification[] }) {
  if (items.length === 0) return null;
  return (
    <View className="gap-2">
      <Text className="text-[11px] font-medium uppercase tracking-[1.2px] text-muted-foreground/70">
        {title}
      </Text>
      <View className="gap-2">
        {items.map((n) => (
          <NotificationRow key={n.id} notification={n} />
        ))}
      </View>
    </View>
  );
}

export default function InboxScreen() {
  const notifications = useMobileDemoStore((s) => s.notifications);
  const markAllRead = useMobileDemoStore((s) => s.markAllNotificationsRead);

  const unread = notifications.filter((n) => !n.read).length;
  const todayItems = notifications.filter((n) => n.today);
  const earlierItems = notifications.filter((n) => !n.today);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="gap-4 px-5 pt-4">
          <View className="flex-row items-end justify-between">
            <View>
              <Text className="text-2xl font-semibold text-foreground">Inbox</Text>
              <Text className="text-[13px] text-muted-foreground">
                {unread > 0 ? `${unread} unread` : 'All caught up'}
              </Text>
            </View>
            {unread > 0 ? (
              <Pressable
                onPress={markAllRead}
                className="flex-row items-center gap-1 rounded-lg px-2 py-1.5 active:opacity-70"
              >
                <Icon as={CheckCheck} size={14} className="text-primary" />
                <Text className="text-xs font-medium text-primary">Mark all read</Text>
              </Pressable>
            ) : null}
          </View>

          {notifications.length === 0 ? (
            <View className="items-center rounded-2xl border border-dashed border-border py-12">
              <Icon as={Inbox} size={32} className="mb-2 text-muted-foreground/40" />
              <Text className="text-sm font-medium text-foreground">Inbox zero</Text>
            </View>
          ) : null}

          <Section title="Today" items={todayItems} />
          <Section title="Earlier" items={earlierItems} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
