import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import { useThemeColors } from '@/shared/lib/theme-colors';
import { SafeAreaView } from '@/shared/components/safe-area-view';
import {
  Bell,
  Bookmark,
  Compass,
  Heart,
  House,
  MessageSquare,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  User,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import { type ReactElement } from 'react';
import { ScrollView, View } from 'react-native';

type Tab = { icon: LucideIcon; label: string };
const TABS: Tab[] = [
  { icon: House, label: 'Home' },
  { icon: Search, label: 'Search' },
  { icon: Bell, label: 'Alerts' },
  { icon: User, label: 'Profile' },
];

/** 1 · Classic — icon + label, active tinted primary. */
function ClassicBar() {
  return (
    <View className="flex-row items-center justify-around rounded-2xl border border-border bg-card px-2 py-2.5">
      {TABS.map((t, i) => (
        <View key={t.label} className="items-center gap-1">
          <Icon
            as={t.icon}
            size={22}
            className={i === 0 ? 'text-primary' : 'text-muted-foreground'}
          />
          <Text
            className={cn(
              'text-[10px]',
              i === 0 ? 'font-semibold text-primary' : 'text-muted-foreground',
            )}
          >
            {t.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** 2 · Active pill — Material-3 style pill behind the active tab; others icon-only. */
function PillBar() {
  return (
    <View className="flex-row items-center justify-around rounded-2xl border border-border bg-card px-2 py-2">
      {TABS.map((t, i) =>
        i === 0 ? (
          <View
            key={t.label}
            className="flex-row items-center gap-1.5 rounded-full bg-primary/12 px-3.5 py-2"
          >
            <Icon as={t.icon} size={20} className="text-primary" />
            <Text className="text-[13px] font-semibold text-primary">{t.label}</Text>
          </View>
        ) : (
          <View key={t.label} className="px-3.5 py-2">
            <Icon as={t.icon} size={22} className="text-muted-foreground" />
          </View>
        ),
      )}
    </View>
  );
}

/** 3 · Icons only — minimal, active marked with a dot. */
function IconsBar() {
  return (
    <View className="flex-row items-center justify-around rounded-2xl border border-border bg-card py-3.5">
      {TABS.map((t, i) => (
        <View key={t.label} className="items-center gap-1.5">
          <Icon
            as={t.icon}
            size={23}
            className={i === 0 ? 'text-primary' : 'text-muted-foreground'}
          />
          <View
            className={cn('size-1.5 rounded-full', i === 0 ? 'bg-primary' : 'bg-transparent')}
          />
        </View>
      ))}
    </View>
  );
}

/** 4 · Floating island — detached rounded bar with shadow. */
function FloatingBar() {
  return (
    <View className="items-center">
      <View className="flex-row items-center gap-8 rounded-full border border-border bg-card px-7 py-3.5 shadow-lg shadow-black/20">
        {TABS.map((t, i) => (
          <Icon
            key={t.label}
            as={t.icon}
            size={23}
            className={i === 0 ? 'text-primary' : 'text-muted-foreground'}
          />
        ))}
      </View>
    </View>
  );
}

/** 5 · Center action — raised FAB between the tabs. */
function FabBar() {
  const tab = (t: Tab, active: boolean) => (
    <View key={t.label} className="flex-1 items-center gap-1">
      <Icon as={t.icon} size={22} className={active ? 'text-primary' : 'text-muted-foreground'} />
      <Text
        className={cn(
          'text-[10px]',
          active ? 'font-semibold text-primary' : 'text-muted-foreground',
        )}
      >
        {t.label}
      </Text>
    </View>
  );
  return (
    <View className="flex-row items-center rounded-2xl border border-border bg-card px-2 py-2.5">
      {tab(TABS[0], true)}
      {tab(TABS[1], false)}
      <View className="flex-1 items-center">
        <View className="-mt-9 size-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/40">
          <Icon as={Plus} size={26} className="text-primary-foreground" />
        </View>
      </View>
      {tab(TABS[2], false)}
      {tab(TABS[3], false)}
    </View>
  );
}

/** 6 · Top indicator — a line above the active tab. */
function IndicatorBar() {
  return (
    <View className="flex-row items-stretch justify-around overflow-hidden rounded-2xl border border-border bg-card">
      {TABS.map((t, i) => (
        <View key={t.label} className="flex-1 items-center gap-1 py-2.5">
          <View
            className={cn(
              'absolute top-0 h-0.5 w-8 rounded-full',
              i === 0 ? 'bg-primary' : 'bg-transparent',
            )}
          />
          <Icon
            as={t.icon}
            size={22}
            className={i === 0 ? 'text-primary' : 'text-muted-foreground'}
          />
          <Text
            className={cn(
              'text-[10px]',
              i === 0 ? 'font-semibold text-primary' : 'text-muted-foreground',
            )}
          >
            {t.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** 7 · Floating pill, labeled — neutral oval behind the active tab + a badge. */
function FloatingLabeledBar() {
  const tabs: Tab[] = [
    { icon: House, label: 'Home' },
    { icon: Store, label: 'Shop' },
    { icon: Heart, label: 'Saved' },
    { icon: User, label: 'You' },
    { icon: ShoppingBag, label: 'Cart' },
  ];
  return (
    <View className="items-center">
      <View className="flex-row items-center gap-0.5 rounded-full border border-border bg-card px-2 py-2 shadow-lg shadow-black/15">
        {tabs.map((t, i) => (
          <View
            key={t.label}
            className={cn('items-center gap-0.5 rounded-full px-3 py-1.5', i === 0 && 'bg-muted')}
          >
            <View>
              <Icon
                as={t.icon}
                size={20}
                className={i === 0 ? 'text-foreground' : 'text-muted-foreground'}
              />
              {i === 4 ? (
                <View className="bg-background absolute -right-2 -top-1 rounded-full p-0.5">
                  <View className="bg-destructive size-3.5 items-center justify-center rounded-full">
                    <Text className="text-[8px] font-bold text-white">1</Text>
                  </View>
                </View>
              ) : null}
            </View>
            <Text
              className={cn(
                'text-[9px]',
                i === 0 ? 'font-semibold text-foreground' : 'text-muted-foreground',
              )}
            >
              {t.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** 8 · Minimal — icons-only, active shown by a filled (solid) icon. */
function FilledIconBar() {
  const c = useThemeColors();
  const tabs: LucideIcon[] = [House, Search, Compass, Zap, User];
  return (
    <View className="flex-row items-center justify-around border-t border-border bg-card py-3.5">
      {tabs.map((T, i) => (
        <T
          key={i}
          size={24}
          color={i === 0 ? c.foreground : c.mutedForeground}
          fill={i === 0 ? c.foreground : 'transparent'}
          strokeWidth={i === 0 ? 1.5 : 2}
        />
      ))}
    </View>
  );
}

/** 9 · Capsule — active icon inside a filled accent circle. */
function AccentCircleBar() {
  const tabs: Tab[] = [
    { icon: House, label: 'Today' },
    { icon: Sparkles, label: 'Practice' },
    { icon: Heart, label: 'Healing' },
    { icon: Bookmark, label: 'Learn' },
    { icon: User, label: 'You' },
  ];
  return (
    <View className="items-center">
      <View className="flex-row items-center gap-4 rounded-full border border-border bg-card px-5 py-2.5 shadow-lg shadow-black/15">
        {tabs.map((t, i) => (
          <View key={t.label} className="items-center gap-1">
            <View
              className={cn(
                'size-9 items-center justify-center rounded-full',
                i === 2 && 'bg-primary',
              )}
            >
              <Icon
                as={t.icon}
                size={18}
                className={i === 2 ? 'text-primary-foreground' : 'text-muted-foreground'}
              />
            </View>
            <Text
              className={cn(
                'text-[9px]',
                i === 2 ? 'font-medium text-foreground' : 'text-muted-foreground',
              )}
            >
              {t.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** 10 · Inline create — a bordered "+" tab sits in the row (not raised). */
function InlineCreateBar() {
  const tabs: (Tab | 'create')[] = [
    { icon: Search, label: 'Search' },
    'create',
    { icon: Bookmark, label: 'Rides' },
    { icon: MessageSquare, label: 'Inbox' },
    { icon: User, label: 'Profile' },
  ];
  return (
    <View className="flex-row items-center justify-around rounded-2xl border border-border bg-card px-2 py-2.5">
      {tabs.map((t, i) =>
        t === 'create' ? (
          <View key="create" className="items-center gap-1">
            <View className="size-7 items-center justify-center rounded-full border-2 border-muted-foreground">
              <Icon as={Plus} size={15} className="text-muted-foreground" />
            </View>
            <Text className="text-[9px] text-muted-foreground">Publish</Text>
          </View>
        ) : (
          <View key={t.label} className="items-center gap-1">
            <Icon
              as={t.icon}
              size={22}
              className={i === 0 ? 'text-primary' : 'text-muted-foreground'}
            />
            <Text
              className={cn(
                'text-[9px]',
                i === 0 ? 'font-semibold text-primary' : 'text-muted-foreground',
              )}
            >
              {t.label}
            </Text>
          </View>
        ),
      )}
    </View>
  );
}

/** 11 · Floating pill — icons-only with a solid contrast center action. */
function SolidActionBar() {
  const items: (LucideIcon | 'create')[] = [House, Search, 'create', Bookmark, User];
  return (
    <View className="items-center">
      <View className="flex-row items-center gap-3 rounded-full border border-border bg-card px-3 py-2 shadow-lg shadow-black/15">
        {items.map((t, i) =>
          t === 'create' ? (
            <View
              key="create"
              className="bg-foreground size-11 items-center justify-center rounded-full"
            >
              <Icon as={Plus} size={24} className="text-background" />
            </View>
          ) : (
            <View
              key={i}
              className={cn(
                'size-10 items-center justify-center rounded-full',
                i === 0 && 'bg-muted',
              )}
            >
              <Icon
                as={t}
                size={22}
                className={i === 0 ? 'text-foreground' : 'text-muted-foreground'}
              />
            </View>
          ),
        )}
      </View>
    </View>
  );
}

const STYLES: { name: string; render: () => ReactElement }[] = [
  { name: 'Classic · icon + label', render: ClassicBar },
  { name: 'Active pill · Material 3', render: PillBar },
  { name: 'Icons only · minimal', render: IconsBar },
  { name: 'Floating island', render: FloatingBar },
  { name: 'Center action · FAB', render: FabBar },
  { name: 'Top indicator', render: IndicatorBar },
  { name: 'Floating pill · labeled', render: FloatingLabeledBar },
  { name: 'Minimal · filled active', render: FilledIconBar },
  { name: 'Capsule · accent circle', render: AccentCircleBar },
  { name: 'Inline create tab', render: InlineCreateBar },
  { name: 'Floating pill · solid action', render: SolidActionBar },
];

/** Bottom navigation — a gallery of the most common tab-bar styles. */
export function BottomNavBlock() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="h-11 flex-row items-center justify-center px-14">
        <Text className="text-base font-semibold text-foreground">Bottom navigation</Text>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="gap-7 px-5 pt-2">
          <Text variant="muted" className="text-sm">
            The most common tab-bar styles — pick one for your app.
          </Text>
          {STYLES.map((s) => (
            <View key={s.name} className="gap-2">
              <Text className="px-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {s.name}
              </Text>
              {s.render()}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
