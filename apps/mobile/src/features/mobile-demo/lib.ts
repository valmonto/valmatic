import type { DemoPriority } from './store';

/**
 * Shared priority styling so cards, detail view and sheet stay consistent.
 * Split into the pill container (bg + border) and its text colour so the two
 * don't both paint a background.
 */
export const priorityMeta: Record<
  DemoPriority,
  { label: string; container: string; text: string }
> = {
  urgent: {
    label: 'Urgent',
    container: 'bg-red-500/10 border border-red-500/20',
    text: 'text-red-600 dark:text-red-400',
  },
  high: {
    label: 'High',
    container: 'bg-orange-500/10 border border-orange-500/20',
    text: 'text-orange-600 dark:text-orange-400',
  },
  medium: {
    label: 'Medium',
    container: 'bg-amber-500/10 border border-amber-500/20',
    text: 'text-amber-600 dark:text-amber-400',
  },
  low: {
    label: 'Low',
    container: 'bg-muted border border-border',
    text: 'text-muted-foreground',
  },
};
