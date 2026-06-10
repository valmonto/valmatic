import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { k } from '@pkg/locales';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { useAuth } from '@/shared/auth/auth-context';
import {
  ArrowUpRight,
  TrendingUp,
  Users,
  Activity,
  DollarSign,
  Settings,
  type LucideIcon,
} from 'lucide-react';

type QuickAction = {
  titleKey: string;
  descKey: string;
  icon: LucideIcon;
  to?: string;
  soon?: boolean;
};

const stats = [
  { titleKey: k.common.dashboard.totalUsers, value: '2,847', change: '+12.5%', icon: Users },
  { titleKey: k.common.dashboard.activeSessions, value: '1,234', change: '+8.2%', icon: Activity },
  { titleKey: k.common.dashboard.revenue, value: '$48,290', change: '+23.1%', icon: DollarSign },
  { titleKey: k.common.dashboard.growth, value: '18.2%', change: '+4.3%', icon: TrendingUp },
];

const chartData = [
  { day: 'Mon', visitors: 186, sessions: 80 },
  { day: 'Tue', visitors: 305, sessions: 200 },
  { day: 'Wed', visitors: 237, sessions: 120 },
  { day: 'Thu', visitors: 273, sessions: 190 },
  { day: 'Fri', visitors: 409, sessions: 300 },
  { day: 'Sat', visitors: 214, sessions: 140 },
  { day: 'Sun', visitors: 182, sessions: 100 },
];

const chartConfig = {
  visitors: { label: 'Visitors', color: 'var(--primary)' },
  sessions: { label: 'Sessions', color: 'var(--muted-foreground)' },
} satisfies ChartConfig;

const recentActivity = [
  {
    actionKey: k.common.activity.newUserRegistered,
    detail: 'john@example.com',
    timeKey: k.common.time.minuteAgo,
  },
  {
    actionKey: k.common.activity.settingsUpdated,
    detailKey: k.common.activity.emailNotificationsEnabled,
    timeKey: k.common.time.minutesAgo,
  },
  {
    actionKey: k.common.activity.reportGenerated,
    detailKey: k.common.activity.monthlyAnalyticsExport,
    timeKey: k.common.time.hourAgo,
  },
  {
    actionKey: k.common.activity.securityCheckPassed,
    detailKey: k.common.dashboard.allSystemsOperational,
    timeKey: k.common.time.hoursAgo,
  },
];

const quickActions: QuickAction[] = [
  { titleKey: k.users.management, descKey: k.users.manageRolesDescription, icon: Users, to: '/users' },
  { titleKey: k.common.nav.analytics, descKey: k.common.analytics.description, icon: Activity, soon: true },
  { titleKey: k.common.nav.settings, descKey: k.common.settings.description, icon: Settings, to: '/settings' },
];

export default function IndexPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const displayName = user?.displayName || user?.name || 'there';

  return (
    <div className="space-y-5">
      {/* Page heading */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          {t(k.auth.welcomeBackName, { name: displayName })}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{t(k.common.dashboard.subtitle)}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.titleKey}>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-muted-foreground">
                  {t(stat.titleKey)}
                </span>
                <stat.icon className="size-4 text-muted-foreground/60" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[26px] font-semibold leading-none tabular-nums tracking-tight">
                  {stat.value}
                </span>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-500">
                  {stat.change}
                </span>
              </div>
              <p className="text-xs text-muted-foreground/70">
                {t(k.common.dashboard.fromLastMonth)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart + Activity */}
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t(k.common.dashboard.weeklyActivity)}</CardTitle>
            <CardDescription>{t(k.common.dashboard.weeklyActivityDesc)}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[260px] w-full">
              <AreaChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <defs>
                  <linearGradient id="fillVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-visitors)" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="var(--color-visitors)" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="fillSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-sessions)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--color-sessions)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area
                  dataKey="sessions"
                  type="monotone"
                  fill="url(#fillSessions)"
                  stroke="var(--color-sessions)"
                  strokeWidth={1.5}
                  stackId="a"
                />
                <Area
                  dataKey="visitors"
                  type="monotone"
                  fill="url(#fillVisitors)"
                  stroke="var(--color-visitors)"
                  strokeWidth={2}
                  stackId="a"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Recent activity — timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t(k.common.dashboard.recentActivity)}</CardTitle>
            <CardDescription>{t(k.common.dashboard.recentActivityDesc)}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative space-y-5">
              <div className="absolute left-[3px] top-2 bottom-2 w-px bg-border" />
              {recentActivity.map((item, i) => (
                <div key={i} className="relative flex items-start gap-3 pl-5">
                  <div className="absolute left-0 top-1.5 size-[7px] rounded-full bg-muted-foreground/50 ring-2 ring-card" />
                  <div className="flex-1 space-y-0.5">
                    <p className="text-[13px] font-medium leading-none">{t(item.actionKey)}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.detailKey ? t(item.detailKey) : item.detail}
                    </p>
                    <p className="text-[11px] text-muted-foreground/60">{t(item.timeKey)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((action) => (
          <Card key={action.titleKey} className="group/action gap-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2.5 text-[15px]">
                <div className="flex size-8 items-center justify-center rounded-md border bg-muted/40 text-muted-foreground">
                  <action.icon className="size-4" />
                </div>
                {t(action.titleKey)}
              </CardTitle>
              <CardDescription>{t(action.descKey)}</CardDescription>
            </CardHeader>
            <CardContent>
              {action.soon ? (
                <Badge variant="outline" className="text-muted-foreground">
                  {t(k.common.comingSoon)}
                </Badge>
              ) : (
                <Button variant="outline" size="sm" asChild>
                  <Link to={action.to ?? '#'}>
                    {t(k.common.actions.open)}
                    <ArrowUpRight className="size-3 transition-transform group-hover/action:translate-x-0.5 group-hover/action:-translate-y-0.5" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
