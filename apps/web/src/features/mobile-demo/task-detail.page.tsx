import { Link, useNavigate, useParams } from 'react-router';
import { Check, ChevronLeft, Clock, MessageSquare } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/components/ui/button';
import { priorityMeta } from './lib';
import { useMobileDemoStore } from './store';

export default function MobileTaskDetailPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const task = useMobileDemoStore((state) => state.tasks.find((t) => t.id === taskId));
  const toggleTaskStatus = useMobileDemoStore((state) => state.toggleTaskStatus);
  const toggleSubtask = useMobileDemoStore((state) => state.toggleSubtask);

  if (!task) {
    return (
      <div className="flex flex-col items-center gap-3 pt-20 text-center">
        <p className="text-sm font-medium">Task not found</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/mobile/tasks">Back to tasks</Link>
        </Button>
      </div>
    );
  }

  const done = task.status === 'done';
  const subtasksDone = task.subtasks.filter((subtask) => subtask.done).length;
  const progress = task.subtasks.length
    ? Math.round((subtasksDone / task.subtasks.length) * 100)
    : done
      ? 100
      : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="-ml-2 flex items-center gap-0.5 rounded-lg py-1 pr-2 pl-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4.5" />
          Back
        </button>
        <span className="text-xs font-medium text-muted-foreground/70 tabular-nums">{task.id}</span>
      </header>

      {/* Title block */}
      <section>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset',
              priorityMeta[task.priority].className,
            )}
          >
            {priorityMeta[task.priority].label}
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <span className={cn('size-1.5 rounded-full', task.projectColor)} />
            {task.project}
          </span>
          <span
            className={cn(
              'ml-auto flex items-center gap-1 text-[11px] font-medium',
              task.dueToday && !done
                ? 'text-orange-600 dark:text-orange-400'
                : 'text-muted-foreground',
            )}
          >
            <Clock className="size-3" />
            {task.due}
          </span>
        </div>
        <h1
          className={cn(
            'mt-2.5 text-xl font-semibold tracking-tight',
            done && 'text-muted-foreground line-through decoration-muted-foreground/50',
          )}
        >
          {task.title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{task.description}</p>
      </section>

      {/* Assignees */}
      <section className="flex items-center gap-2">
        <span className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground/70 uppercase">
          Assignees
        </span>
        <div className="flex -space-x-1.5">
          {task.assignees.map((assignee) => (
            <span
              key={assignee.initials}
              title={assignee.name}
              className="flex size-6 items-center justify-center rounded-full bg-muted text-[9px] font-semibold text-muted-foreground ring-2 ring-background"
            >
              {assignee.initials}
            </span>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">
          {task.assignees.map((assignee) => assignee.name.split(' ')[0]).join(', ')}
        </span>
      </section>

      {/* Subtasks */}
      {task.subtasks.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold tracking-tight">Subtasks</h2>
            <span className="text-xs text-muted-foreground tabular-nums">
              {subtasksDone}/{task.subtasks.length} · {progress}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="rounded-2xl border border-border/60 bg-card shadow-[0_1px_2px_rgba(16,18,28,0.04)]">
            {task.subtasks.map((subtask, index) => (
              <button
                key={subtask.id}
                type="button"
                onClick={() => toggleSubtask(task.id, subtask.id)}
                className={cn(
                  'flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-muted/40',
                  index > 0 && 'border-t border-border/40',
                )}
              >
                <span
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-all duration-200',
                    subtask.done
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted-foreground/35',
                  )}
                >
                  <Check
                    className={cn(
                      'size-2.5 transition-all duration-200',
                      subtask.done ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
                    )}
                    strokeWidth={3}
                  />
                </span>
                <span
                  className={cn(
                    'text-[13px] font-medium transition-colors',
                    subtask.done && 'text-muted-foreground line-through decoration-muted-foreground/50',
                  )}
                >
                  {subtask.title}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Comments */}
      <section className="space-y-2.5">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold tracking-tight">
          <MessageSquare className="size-3.5 text-muted-foreground" />
          Comments
        </h2>
        {task.comments.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/70 py-6 text-center text-xs text-muted-foreground">
            No comments yet.
          </p>
        ) : (
          <div className="space-y-2.5">
            {task.comments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-2xl border border-border/60 bg-card p-3.5 shadow-[0_1px_2px_rgba(16,18,28,0.04)]"
              >
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-muted text-[9px] font-semibold text-muted-foreground">
                    {comment.initials}
                  </span>
                  <span className="text-xs font-semibold">{comment.author}</span>
                  <span className="ml-auto text-[11px] text-muted-foreground">{comment.time}</span>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                  {comment.body}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <Button
        className="w-full"
        size="lg"
        variant={done ? 'outline' : 'default'}
        onClick={() => toggleTaskStatus(task.id)}
      >
        <Check className="size-4" />
        {done ? 'Reopen task' : 'Mark as done'}
      </Button>
    </div>
  );
}
