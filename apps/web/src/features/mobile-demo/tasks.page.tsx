import { useMemo, useState } from 'react';
import { Search, SquareCheckBig } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { TaskCard } from './components/task-card';
import { useMobileDemoStore } from './store';

type Filter = 'all' | 'active' | 'done';

const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'done', label: 'Done' },
];

export default function MobileTasksPage() {
  const tasks = useMobileDemoStore((state) => state.tasks);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((task) => {
      if (filter === 'active' && task.status === 'done') return false;
      if (filter === 'done' && task.status !== 'done') return false;
      if (!q) return true;
      return (
        task.title.toLowerCase().includes(q) ||
        task.project.toLowerCase().includes(q) ||
        task.id.toLowerCase().includes(q)
      );
    });
  }, [tasks, filter, query]);

  const activeCount = tasks.filter((task) => task.status !== 'done').length;

  return (
    <div className="space-y-4">
      <header className="pt-2">
        <h1 className="text-[22px] font-semibold tracking-tight">Tasks</h1>
        <p className="text-[13px] text-muted-foreground">
          {activeCount} active · {tasks.length - activeCount} done
        </p>
      </header>

      <div className="relative">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground/60" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tasks…"
          className="h-10 w-full rounded-xl border border-border/60 bg-muted/40 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ring focus:bg-background focus:ring-[3px] focus:ring-ring/20"
        />
      </div>

      <div className="flex rounded-xl bg-muted p-1" role="tablist" aria-label="Filter tasks">
        {filters.map((option) => (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={filter === option.value}
            onClick={() => setFilter(option.value)}
            className={cn(
              'flex-1 rounded-lg py-1.5 text-xs font-medium transition-all duration-200',
              filter === option.value
                ? 'bg-background text-foreground shadow-[0_1px_2px_rgba(16,18,28,0.08)]'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 py-12 text-center">
          <SquareCheckBig className="mx-auto mb-2 size-8 text-muted-foreground/40" />
          <p className="text-sm font-medium">No tasks here</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {query ? 'Try a different search.' : 'Tap + to create one.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {visible.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
