import type { DemoPriority } from './store';

/** Shared priority styling so cards, detail view and sheet stay consistent. */
export const priorityMeta: Record<DemoPriority, { label: string; className: string }> = {
  urgent: {
    label: 'Urgent',
    className: 'bg-red-500/10 text-red-600 dark:text-red-400 ring-red-500/20',
  },
  high: {
    label: 'High',
    className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 ring-orange-500/20',
  },
  medium: {
    label: 'Medium',
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20',
  },
  low: {
    label: 'Low',
    className: 'bg-muted text-muted-foreground ring-border/60',
  },
};
