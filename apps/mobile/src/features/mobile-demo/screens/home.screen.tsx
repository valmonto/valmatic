import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from '@/shared/components/safe-area-view';
import { Link } from 'expo-router';
import {
  ArrowUpRight,
  Flame,
  GitCommitHorizontal,
  MessageSquare,
  Rocket,
  UserPlus,
  type LucideIcon,
} from 'lucide-react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import { TaskCard } from '../components/task-card';
import { Sparkline } from '../components/sparkline';
import { useMobileDemoStore } from '../store';

const sparkData = {
  active: [4, 6, 5, 8, 7, 9, 8],
  completed: [2, 3, 5, 4, 6, 8, 9],
  velocity: [30, 42, 38, 50, 47, 58, 64],
};

const activity: { id: string; icon: LucideIcon; iconClass: string; title: string; meta: string }[] = [
  { id: 'a1', icon: Rocket, iconClass: 'bg-primary/10 text-primary', title: 'api@2.14.0 deployed to production', meta: 'Deploy bot · 38m ago' },
  { id: 'a2', icon: MessageSquare, iconClass: 'bg-sky-500/10 text-sky-500', title: 'Grace commented on Ship onboarding redesign', meta: 'TSK-128 · 45m ago' },
  { id: 'a3', icon: GitCommitHorizontal, iconClass: 'bg-emerald-500/10 text-emerald-500', title: 'Linus merged retry-with-backoff', meta: 'TSK-127 · 1h ago' },
  { id: 'a4', icon: UserPlus, iconClass: 'bg-amber-500/10 text-amber-500', title: 'Katherine joined the Operations project', meta: 'Workspace · 3h ago' },
];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const tasks = useMobileDemoStore((s) => s.tasks);
  const today = useMemo(
    () => new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }),
    []
  );

  const todaysTasks = tasks.filter((t) => t.dueToday);
  const doneToday = todaysTasks.filter((t) => t.status === 'done').length;
  const progress = todaysTasks.length ? Math.round((doneToday / todaysTasks.length) * 100) : 0;
  const activeCount = tasks.filter((t) => t.status !== 'done').length;
  const openToday = todaysTasks.filter((t) => t.status !== 'done');

  const stats = [
    { label: 'Active tasks', value: String(activeCount), change: '+2', data: sparkData.active, color: '#5a60c2' },
    { label: 'Done this week', value: '9', change: '+38%', data: sparkData.completed, color: '#10b981' },
    { label: 'Velocity', value: '64', change: '+12%', data: sparkData.velocity, color: '#0ea5e9' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="gap-6 px-5 pt-2">
          {/* Greeting */}
          <View className="flex-row items-center justify-between pt-2">
            <View>
              <Text className="text-[11px] font-medium uppercase tracking-[1.5px] text-muted-foreground">
                {today}
              </Text>
              <Text className="mt-0.5 text-2xl font-semibold text-foreground">{greeting()}, Alex</Text>
            </View>
            <View className="h-10 w-10 items-center justify-center rounded-full bg-primary shadow-md shadow-primary/30">
              <Text className="text-sm font-semibold text-primary-foreground">AM</Text>
            </View>
          </View>

          {/* Today's focus */}
          <View className="rounded-2xl border border-border bg-card p-4 shadow-sm shadow-black/5">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                  <Icon as={Flame} size={16} className="text-primary" />
                </View>
                <View>
                  <Text className="text-sm font-semibold text-foreground">Today&apos;s focus</Text>
                  <Text className="text-[11px] text-muted-foreground">
                    {doneToday} of {todaysTasks.length} tasks done
                  </Text>
                </View>
              </View>
              <Text className="text-lg font-semibold text-primary">{progress}%</Text>
            </View>
            <View className="mt-3 overflow-hidden rounded-full bg-muted" style={{ height: 6 }}>
              <View className="rounded-full bg-primary" style={{ height: 6, width: `${progress}%` }} />
            </View>
          </View>

          {/* Stats */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12 }}
          >
            {stats.map((stat) => (
              <View
                key={stat.label}
                className="w-36 rounded-2xl border border-border bg-card p-3 shadow-sm shadow-black/5"
              >
                <Text className="text-[11px] font-medium text-muted-foreground">{stat.label}</Text>
                <View className="mt-1 flex-row items-baseline gap-1.5">
                  <Text className="text-xl font-semibold text-foreground">{stat.value}</Text>
                  <View className="flex-row items-center">
                    <Icon as={ArrowUpRight} size={10} className="text-emerald-500" />
                    <Text className="text-[10px] font-medium text-emerald-500">{stat.change}</Text>
                  </View>
                </View>
                <View className="mt-1.5">
                  <Sparkline data={stat.data} color={stat.color} width={120} height={32} />
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Due today */}
          <View className="gap-3">
            <View className="flex-row items-baseline justify-between">
              <Text className="text-sm font-semibold text-foreground">Due today</Text>
              <Link href="/tasks" asChild>
                <Text className="text-xs font-medium text-primary">View all</Text>
              </Link>
            </View>
            {openToday.length === 0 ? (
              <View className="rounded-2xl border border-dashed border-border py-8">
                <Text className="text-center text-sm font-medium text-foreground">All clear for today 🎉</Text>
              </View>
            ) : (
              <View className="gap-2.5">
                {openToday.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </View>
            )}
          </View>

          {/* Activity */}
          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground">Activity</Text>
            <View className="rounded-2xl border border-border bg-card shadow-sm shadow-black/5">
              {activity.map((item, index) => {
                const [bgClass, textClass] = item.iconClass.split(' ');
                return (
                  <View
                    key={item.id}
                    className={cn(
                      'flex-row items-center gap-3 px-3.5 py-3',
                      index > 0 && 'border-t border-border'
                    )}
                  >
                    <View className={cn('h-8 w-8 items-center justify-center rounded-full', bgClass)}>
                      <Icon as={item.icon} size={16} className={textClass} />
                    </View>
                    <View className="min-w-0 flex-1">
                      <Text numberOfLines={1} className="text-[13px] font-medium text-foreground">
                        {item.title}
                      </Text>
                      <Text className="text-[11px] text-muted-foreground">{item.meta}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
