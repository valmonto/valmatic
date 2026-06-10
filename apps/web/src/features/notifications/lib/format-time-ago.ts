import { k } from '@pkg/locales';

type Translate = (key: string, opts?: Record<string, unknown>) => string;

/** Relative "x minutes ago" formatting shared by the bell and the page. */
export function formatTimeAgo(dateString: string, t: Translate): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t(k.notifications.time.justNow);
  if (diffMins < 60) return t(k.notifications.time.minutesAgo, { count: diffMins });
  if (diffHours < 24) return t(k.notifications.time.hoursAgo, { count: diffHours });
  if (diffDays < 7) return t(k.notifications.time.daysAgo, { count: diffDays });
  return date.toLocaleDateString();
}
