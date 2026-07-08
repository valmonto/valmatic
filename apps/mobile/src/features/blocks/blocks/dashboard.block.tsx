import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BarChart } from '@/components/ui/bar-chart';
import { Icon } from '@/components/ui/icon';
import { Sparkline } from '@/components/ui/sparkline';
import { StatTile } from '@/components/ui/stat-tile';
import { Text } from '@/components/ui/text';
import { Timeline } from '@/components/ui/timeline';
import { SafeAreaView } from '@/shared/components/safe-area-view';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowUpRight, Bell, CircleCheck, CreditCard, Users } from 'lucide-react-native';
import { ScrollView, useWindowDimensions, View } from 'react-native';

/** Dashboard / Home — greeting, gradient revenue hero, KPIs, chart, activity. */
export function DashboardBlock() {
  const { width } = useWindowDimensions();
  const heroChartWidth = width - 40 - 40; // screen px-5 + card padding

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="gap-6 px-5 pt-2">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-[11px] font-medium uppercase tracking-[1.5px] text-muted-foreground">
                Monday, Jul 8
              </Text>
              <Text variant="h1" className="mt-0.5 text-2xl">Good morning, Alex</Text>
            </View>
            <View className="flex-row items-center gap-3">
              <View>
                <Icon as={Bell} size={22} className="text-foreground" />
                <View className="bg-destructive border-background absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2" />
              </View>
              <Avatar alt="Alex" className="size-9">
                <AvatarImage source={{ uri: 'https://i.pravatar.cc/80?img=15' }} />
                <AvatarFallback><Text className="text-xs font-medium">AM</Text></AvatarFallback>
              </Avatar>
            </View>
          </View>

          {/* Revenue hero */}
          <LinearGradient
            colors={['#4f46e5', '#7c3aed']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 24, padding: 20 }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-white/80">Total revenue</Text>
              <View className="flex-row items-center gap-0.5 rounded-full bg-white/15 px-2 py-0.5">
                <Icon as={ArrowUpRight} size={12} className="text-white" />
                <Text className="text-xs font-semibold text-white">12.5%</Text>
              </View>
            </View>
            <Text className="mt-1.5 text-3xl font-bold tabular-nums text-white">$48,250</Text>
            <Text className="text-xs text-white/70">vs $42,900 last month</Text>
            <View className="mt-3">
              <Sparkline data={[6, 8, 7, 10, 9, 13, 12, 16]} color="#ffffff" fill width={heroChartWidth} height={40} />
            </View>
          </LinearGradient>

          {/* KPIs */}
          <View className="flex-row gap-3">
            <StatTile className="flex-1" icon={Users} label="Active users" value="2,340" delta="3.1%" deltaDirection="up" caption="vs last wk" />
            <StatTile className="flex-1" icon={CreditCard} label="Conversion" value="4.8%" delta="0.6%" deltaDirection="up" caption="vs last wk" />
          </View>

          {/* Weekly chart */}
          <View className="gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm shadow-black/5">
            <View className="flex-row items-baseline justify-between">
              <Text className="text-sm font-semibold text-foreground">This week</Text>
              <Text variant="muted" className="text-xs">Sessions</Text>
            </View>
            <BarChart
              height={140}
              data={[
                { label: 'Mon', value: 12 },
                { label: 'Tue', value: 19 },
                { label: 'Wed', value: 8 },
                { label: 'Thu', value: 22 },
                { label: 'Fri', value: 17 },
                { label: 'Sat', value: 25 },
                { label: 'Sun', value: 14 },
              ]}
            />
          </View>

          {/* Recent activity */}
          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground">Recent activity</Text>
            <Timeline
              items={[
                { icon: CircleCheck, tone: 'success', title: 'Payment received', description: '$48.00 from Ada Lovelace', time: '2:14 PM' },
                { icon: Users, tone: 'primary', title: 'New teammate joined', description: 'Grace accepted the invite', time: '11:02 AM' },
                { icon: CreditCard, tone: 'muted', title: 'Subscription renewed', time: 'Yesterday' },
              ]}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
