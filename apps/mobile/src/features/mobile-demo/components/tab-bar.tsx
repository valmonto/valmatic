import { Pressable, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { House, Inbox, Plus, SquareCheckBig, User, type LucideIcon } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import { useMobileDemoStore } from '../store';

const TAB_META: Record<string, { labelKey: string; icon: LucideIcon }> = {
  index: { labelKey: 'common.nav.home', icon: House },
  tasks: { labelKey: 'common.nav.tasks', icon: SquareCheckBig },
  inbox: { labelKey: 'common.nav.inbox', icon: Inbox },
  profile: { labelKey: 'common.nav.profile', icon: User },
};

function TabButton({
  routeKey,
  name,
  active,
  badge,
  onPress,
}: {
  routeKey: string;
  name: string;
  active: boolean;
  badge?: number;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const meta = TAB_META[name];
  if (!meta) return null;
  return (
    <Pressable
      key={routeKey}
      onPress={onPress}
      className="flex-1 items-center gap-1 rounded-xl py-1.5 active:opacity-70"
    >
      <View className="relative">
        <Icon
          as={meta.icon}
          size={23}
          className={active ? 'text-primary' : 'text-muted-foreground'}
        />
        {badge && badge > 0 ? (
          <View className="absolute -right-2.5 -top-1.5 h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1">
            <Text className="text-[9px] font-semibold leading-none text-primary-foreground">
              {badge}
            </Text>
          </View>
        ) : null}
      </View>
      <Text
        className={cn(
          'text-[10px] leading-none',
          active ? 'font-semibold text-primary' : 'font-medium text-muted-foreground'
        )}
      >
        {t(meta.labelKey)}
      </Text>
    </Pressable>
  );
}

type TabRoute = { key: string; name: string };
type TabBarProps = {
  state: { index: number; routes: TabRoute[] };
  navigation: {
    emit: (e: { type: 'tabPress'; target: string; canPreventDefault: true }) => {
      defaultPrevented: boolean;
    };
    navigate: (name: string) => void;
  };
};

export function TabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scheme = useColorScheme();
  const unread = useMobileDemoStore(
    (s) => s.notifications.filter((n) => !n.read).length
  );

  const go = (name: string, key: string, focused: boolean) => {
    const event = navigation.emit({ type: 'tabPress', target: key, canPreventDefault: true });
    if (!focused && !event.defaultPrevented) navigation.navigate(name);
  };

  const left = state.routes.filter((r) => r.name === 'index' || r.name === 'tasks');
  const right = state.routes.filter((r) => r.name === 'inbox' || r.name === 'profile');
  const activeName = state.routes[state.index]?.name;

  return (
    <BlurView
      intensity={40}
      tint={scheme === 'dark' ? 'dark' : 'light'}
      className="absolute inset-x-0 bottom-0 border-t border-border bg-background/80"
      style={{ paddingBottom: insets.bottom }}
    >
      <View className="flex-row items-center px-3 pt-1.5">
        {left.map((route) => (
          <TabButton
            key={route.key}
            routeKey={route.key}
            name={route.name}
            active={activeName === route.name}
            onPress={() => go(route.name, route.key, activeName === route.name)}
          />
        ))}

        <View className="flex-1 items-center">
          <Pressable
            onPress={() => router.push('/new-task')}
            className="-mt-6 h-13 w-13 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/40 active:scale-95"
          >
            <Icon as={Plus} size={24} className="text-primary-foreground" />
          </Pressable>
        </View>

        {right.map((route) => (
          <TabButton
            key={route.key}
            routeKey={route.key}
            name={route.name}
            active={activeName === route.name}
            badge={route.name === 'inbox' ? unread : undefined}
            onPress={() => go(route.name, route.key, activeName === route.name)}
          />
        ))}
      </View>
    </BlurView>
  );
}
