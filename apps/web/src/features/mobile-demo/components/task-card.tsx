import { Link } from 'react-router';
import { Check, ChevronRight, Clock } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { priorityMeta } from '../lib';
import { useMobileDemoStore, type DemoTask } from '../store';

export function TaskCard({ task }: { task: DemoTask }) {
  const toggleTaskStatus = useMobileDemoStore((state) => state.toggleTaskStatus);
  const done = task.status === 'done';
  const subtasksDone = task.subtasks.filter((subtask) => subtask.done).length;

  return (
    <div
      className={cn(
        'group relative rounded-2xl border border-border/60 bg-card p-3.5 shadow-[0_1px_2px_rgba(16,18,28,0.04)] transition-all duration-200 active:scale-[0.985]',
        done && 'opacity-60',
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => toggleTaskStatus(task.id)}
          aria-label={done ? `Reopen ${task.title}` : `Complete ${task.title}`}
          className={cn(
            'mt-0.5 flex size-5.5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-all duration-200',
            done
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-muted-foreground/35 hover:border-primary',
          )}
        >
          <Check
            className={cn(
              'size-3 transition-all duration-200',
              done ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
            )}
            strokeWidth={3}
          />
        </button>

        <Link to={`/mobile/tasks/${task.id}`} className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-muted-foreground/70 tabular-nums">
              {task.id}
            </span>
            <span
              className={cn(
                'rounded-full px-1.5 py-px text-[10px] font-semibold ring-1 ring-inset',
                priorityMeta[task.priority].className,
              )}
            >
              {priorityMeta[task.priority].label}
            </span>
          </div>
          <p
            className={cn(
              'mt-0.5 truncate text-sm font-medium transition-colors',
              done && 'text-muted-foreground line-through decoration-muted-foreground/50',
            )}
          >
            {task.title}
          </p>
          <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className={cn('size-1.5 rounded-full', task.projectColor)} />
              {task.project}
            </span>
            <span className={cn('flex items-center gap-1', task.dueToday && !done && 'text-orange-600 dark:text-orange-400')}>
              <Clock className="size-3" />
              {task.due}
            </span>
            {task.subtasks.length > 0 && (
              <span className="tabular-nums">
                {subtasksDone}/{task.subtasks.length}
              </span>
            )}
            <span className="ml-auto flex items-center">
              <span className="flex -space-x-1.5">
                {task.assignees.map((assignee) => (
                  <span
                    key={assignee.initials}
                    title={assignee.name}
                    className="flex size-5 items-center justify-center rounded-full bg-muted text-[8px] font-semibold text-muted-foreground ring-2 ring-card"
                  >
                    {assignee.initials}
                  </span>
                ))}
              </span>
              <ChevronRight className="ml-1 size-3.5 text-muted-foreground/50" />
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
