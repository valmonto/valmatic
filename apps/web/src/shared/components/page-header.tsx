import * as React from 'react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/shared/lib/utils';

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Optional leading icon — rendered in a soft tinted tile to the left of the title. */
  icon?: LucideIcon;
  /** Right-aligned actions (buttons, filters). Wraps below the title on small screens. */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * The single page-header pattern used across every app surface (Users, Jobs,
 * Settings, Notifications). Tight Linear-style title row — no boxed banners.
 * Sits on the canvas with a hairline rule below for separation.
 */
export function PageHeader({ title, description, icon: Icon, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground ring-1 ring-border/60">
            <Icon className="size-4.5" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
