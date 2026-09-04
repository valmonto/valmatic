import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import { SafeAreaView } from '@/shared/components/safe-area-view';
import { LinearGradient } from 'expo-linear-gradient';
import { AtSign, Bell, Rocket, type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

const PREVIEWS: {
  icon: LucideIcon;
  chip: string;
  fg: string;
  title: string;
  body: string;
  time: string;
}[] = [
  {
    icon: AtSign,
    chip: 'bg-sky-500/15',
    fg: 'text-sky-500',
    title: 'Grace mentioned you',
    body: 'in “Ship onboarding redesign”',
    time: 'now',
  },
  {
    icon: Rocket,
    chip: 'bg-emerald-500/15',
    fg: 'text-emerald-500',
    title: 'Deploy succeeded',
    body: 'api@2.14.0 is live in production',
    time: '2m',
  },
];

/** Notification permission priming — gradient hero, realistic previews, soft-ask CTA. */
export function NotificationPrimingBlock() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center gap-9 px-6">
        {/* Hero */}
        <View className="items-center gap-6">
          <View className="items-center justify-center">
            <LinearGradient
              colors={['#6366f1', 'transparent']}
              style={{
                position: 'absolute',
                width: 220,
                height: 220,
                borderRadius: 110,
                opacity: 0.28,
              }}
            />
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 112,
                height: 112,
                borderRadius: 36,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#6366f1',
                shadowOpacity: 0.45,
                shadowRadius: 22,
                shadowOffset: { width: 0, height: 12 },
                elevation: 12,
              }}
            >
              <Icon as={Bell} size={48} className="text-white" />
            </LinearGradient>
            {/* Unread badge */}
            <View className="bg-background absolute -right-1 -top-1 rounded-full p-0.5">
              <View className="bg-destructive size-6 items-center justify-center rounded-full">
                <Text className="text-[10px] font-bold text-white">3</Text>
              </View>
            </View>
          </View>

          <View className="items-center gap-2.5">
            <Text variant="h1" className="text-center text-2xl">
              Never miss a beat
            </Text>
            <Text variant="muted" className="max-w-xs text-center text-base leading-relaxed">
              Turn on notifications so mentions, assignments and deploys reach you the second they
              happen.
            </Text>
          </View>
        </View>

        {/* Realistic previews of what they'll get */}
        <View className="gap-2.5">
          {PREVIEWS.map((n) => (
            <View
              key={n.title}
              className="border-border bg-card flex-row items-center gap-3 rounded-2xl border p-3 shadow-sm shadow-black/10"
            >
              <View className={cn('size-9 items-center justify-center rounded-xl', n.chip)}>
                <Icon as={n.icon} size={16} className={n.fg} />
              </View>
              <View className="flex-1">
                <Text numberOfLines={1} className="text-[13px] font-semibold text-foreground">
                  {n.title}
                </Text>
                <Text numberOfLines={1} variant="muted" className="text-xs">
                  {n.body}
                </Text>
              </View>
              <Text variant="muted" className="text-[11px]">
                {n.time}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTA */}
      <View className="gap-1 px-6 pb-4">
        <Button className="h-13 rounded-2xl shadow-lg shadow-primary/30">
          <Text className="text-base font-semibold">Enable notifications</Text>
        </Button>
        <Button variant="ghost" className="h-12">
          <Text className="text-muted-foreground">Not now</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
