import { useMemo } from 'react';
import { Link } from 'react-router';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, Flame, GitCommitHorizontal, MessageSquare, Rocket, UserPlus } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { TaskCard } from './components/task-card';
import { useMobileDemoStore } from './store';

const sparkData = {
  active: [4, 6, 5, 8, 7, 9, 8].map((v) => ({ v })),
  completed: [2, 3, 5, 4, 6, 8, 9].map((v) => ({ v })),
  velocity: [30, 42, 38, 50, 47, 58, 64].map((v) => ({ v })),
};

const activity = [
  {
    id: 'a1',
    icon: Rocket,
    iconClass: 'bg-primary/10 text-primary',
    title: 'api@2.14.0 deployed to production',
    meta: 'Deploy bot · 38m ago',
  },
  {
    id: 'a2',
    icon: MessageSquare,
    iconClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    title: 'Grace commented on Ship onboarding redesign',
    meta: 'TSK-128 · 45m ago',
  },
  {
    id: 'a3',
    icon: GitCommitHorizontal,
    iconClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    title: 'Linus merged retry-with-backoff',
    meta: 'TSK-127 · 1h ago',
  },
  {
    id: 'a4',
    icon: UserPlus,
    iconClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    title: 'Katherine joined the Operations project',
    meta: 'Workspace · 3h ago',
  },
];

function Sparkline({ data, color }: { data: { v: number }[]; color: string }) {
  return (
    <div className="h-8">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#spark-${color})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function MobileHomePage() {
  const tasks = useMobileDemoStore((state) => state.tasks);

  const today = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    [],
  );

  const todaysTasks = tasks.filter((task) => task.dueToday);
  const doneToday = todaysTasks.filter((task) => task.status === 'done').length;
  const progress = todaysTasks.length ? Math.round((doneToday / todaysTasks.length) * 100) : 0;
  const activeCount = tasks.filter((task) => task.status !== 'done').length;
  const openToday = todaysTasks.filter((task) => task.status !== 'done');

  const stats = [
    { label: 'Active tasks', value: String(activeCount), change: '+2', data: sparkData.active, color: 'var(--primary)' },
    { label: 'Done this week', value: '9', change: '+38%', data: sparkData.completed, color: 'oklch(0.696 0.17 162)' },
    { label: 'Velocity', value: '64', change: '+12%', data: sparkData.velocity, color: 'oklch(0.685 0.169 237)' },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <header className="flex items-center justify-between pt-2">
        <div>
          <p className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground/70 uppercase">
            {today}
          </p>
          <h1 className="mt-0.5 text-[22px] font-semibold tracking-tight">{greeting()}, Alex</h1>
        </div>
        <Link
          to="/mobile/profile"
          className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/30 ring-1 ring-white/20"
        >
          AM
        </Link>
      </header>

      {/* Today's focus */}
      <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-[0_1px_2px_rgba(16,18,28,0.04)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
              <Flame className="size-4 text-primary" />
            </span>
            <div>
              <p className="text-sm font-semibold">Today&apos;s focus</p>
              <p className="text-[11px] text-muted-foreground">
                {doneToday} of {todaysTasks.length} tasks done
              </p>
            </div>
          </div>
          <span className="text-lg font-semibold tabular-nums tracking-tight text-primary">
            {progress}%
          </span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </section>

      {/* Stats */}
      <section className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="w-32 shrink-0 rounded-2xl border border-border/60 bg-card p-3 shadow-[0_1px_2px_rgba(16,18,28,0.04)]"
          >
            <p className="text-[11px] font-medium text-muted-foreground">{stat.label}</p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-semibold tabular-nums tracking-tight">{stat.value}</span>
              <span className="flex items-center text-[10px] font-medium text-emerald-600 dark:text-emerald-500">
                <ArrowUpRight className="size-2.5" />
                {stat.change}
              </span>
            </div>
            <div className="mt-1.5">
              <Sparkline data={stat.data} color={stat.color} />
            </div>
          </div>
        ))}
      </section>

      {/* Due today */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold tracking-tight">Due today</h2>
          <Link to="/mobile/tasks" className="text-xs font-medium text-primary">
            View all
          </Link>
        </div>
        {openToday.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 py-8 text-center">
            <p className="text-sm font-medium">All clear for today 🎉</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Nothing due — enjoy the headroom or pull something forward.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {openToday.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </section>

      {/* Activity */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight">Activity</h2>
        <div className="rounded-2xl border border-border/60 bg-card shadow-[0_1px_2px_rgba(16,18,28,0.04)]">
          {activity.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                'flex items-center gap-3 px-3.5 py-3',
                index > 0 && 'border-t border-border/40',
              )}
            >
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full',
                  item.iconClass,
                )}
              >
                <item.icon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium">{item.title}</p>
                <p className="text-[11px] text-muted-foreground">{item.meta}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
