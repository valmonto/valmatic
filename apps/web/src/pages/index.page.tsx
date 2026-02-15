import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { k } from '@pkg/locales';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { useAuth } from '@/context/auth-context';
import {
  ArrowUpRight,
  TrendingUp,
  Users,
  Activity,
  DollarSign,
  UserPlus,
  Settings,
  FileText,
  ShieldCheck,
} from 'lucide-react';

const stats = [
  {
    titleKey: k.common.dashboard.totalUsers,
    value: '2,847',
    change: '+12.5%',
    icon: Users,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-100 dark:bg-violet-500/15',
  },
  {
    titleKey: k.common.dashboard.activeSessions,
    value: '1,234',
    change: '+8.2%',
    icon: Activity,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-500/15',
  },
  {
    titleKey: k.common.dashboard.revenue,
    value: '$48,290',
    change: '+23.1%',
    icon: DollarSign,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-500/15',
  },
  {
    titleKey: k.common.dashboard.growth,
    value: '18.2%',
    change: '+4.3%',
    icon: TrendingUp,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-500/15',
  },
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
  visitors: { label: 'Visitors', color: 'var(--chart-1)' },
  sessions: { label: 'Sessions', color: 'var(--chart-3)' },
} satisfies ChartConfig;

const recentActivity = [
  { actionKey: k.common.activity.newUserRegistered, detail: 'john@example.com', timeKey: k.common.time.minuteAgo, icon: UserPlus, color: 'text-emerald-600 dark:text-emerald-400', dotColor: 'bg-emerald-500' },
  { actionKey: k.common.activity.settingsUpdated, detailKey: k.common.activity.emailNotificationsEnabled, timeKey: k.common.time.minutesAgo, icon: Settings, color: 'text-blue-600 dark:text-blue-400', dotColor: 'bg-blue-500' },
  { actionKey: k.common.activity.reportGenerated, detailKey: k.common.activity.monthlyAnalyticsExport, timeKey: k.common.time.hourAgo, icon: FileText, color: 'text-violet-600 dark:text-violet-400', dotColor: 'bg-violet-500' },
  { actionKey: k.common.activity.securityCheckPassed, detailKey: k.common.dashboard.allSystemsOperational, timeKey: k.common.time.hoursAgo, icon: ShieldCheck, color: 'text-amber-600 dark:text-amber-400', dotColor: 'bg-amber-500' },
];

export default function IndexPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const displayName = user?.displayName || user?.name || 'there';

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--primary)_0%,transparent_50%)] opacity-[0.08]" />
        <div className="relative">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t(k.auth.welcomeBackName, { name: displayName })}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-lg">
            {t(k.common.dashboard.subtitle)}
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.titleKey}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t(stat.titleKey)}</CardTitle>
              <div className={`flex size-9 items-center justify-center rounded-xl ${stat.bg}`}>
                <stat.icon className={`size-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums tracking-tight">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1.5">
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">{stat.change}</span>{' '}
                {t(k.common.dashboard.fromLastMonth)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart + Activity */}
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        {/* Area chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t(k.common.dashboard.weeklyActivity)}</CardTitle>
            <CardDescription>{t(k.common.dashboard.weeklyActivityDesc)}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <defs>
                  <linearGradient id="fillVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-visitors)" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="var(--color-visitors)" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="fillSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-sessions)" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="var(--color-sessions)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area
                  dataKey="sessions"
                  type="monotone"
                  fill="url(#fillSessions)"
                  stroke="var(--color-sessions)"
                  strokeWidth={2}
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
            <CardTitle>{t(k.common.dashboard.recentActivity)}</CardTitle>
            <CardDescription>{t(k.common.dashboard.recentActivityDesc)}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative space-y-6">
              {/* Timeline line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
              {recentActivity.map((item, i) => (
                <div key={i} className="relative flex items-start gap-4 pl-8">
                  {/* Timeline dot */}
                  <div className={`absolute left-[7px] top-1.5 size-[9px] rounded-full ring-2 ring-background ${item.dotColor}`} />
                  <div className="flex-1 space-y-0.5">
                    <p className="text-sm font-medium leading-none">{t(item.actionKey)}</p>
                    <p className="text-xs text-muted-foreground">{item.detailKey ? t(item.detailKey) : item.detail}</p>
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
        <Card className="group/action">
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/15">
                <Users className="size-4 text-violet-600 dark:text-violet-400" />
              </div>
              {t(k.users.management)}
            </CardTitle>
            <CardDescription>{t(k.users.manageRolesDescription)}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" asChild>
              <Link to="/users">
                {t(k.common.actions.open)}
                <ArrowUpRight className="size-3 transition-transform group-hover/action:translate-x-0.5 group-hover/action:-translate-y-0.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-500/15">
                <Activity className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
              {t(k.common.nav.analytics)}
            </CardTitle>
            <CardDescription>{t(k.common.analytics.description)}</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="text-muted-foreground">{t(k.common.comingSoon)}</Badge>
          </CardContent>
        </Card>
        <Card className="group/action">
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/15">
                <Settings className="size-4 text-amber-600 dark:text-amber-400" />
              </div>
              {t(k.common.nav.settings)}
            </CardTitle>
            <CardDescription>{t(k.common.settings.description)}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" asChild>
              <Link to="/settings">
                {t(k.common.actions.open)}
                <ArrowUpRight className="size-3 transition-transform group-hover/action:translate-x-0.5 group-hover/action:-translate-y-0.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
