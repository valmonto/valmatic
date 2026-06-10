import * as React from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/shared/lib/utils';

interface WideModalProps {
  /** Element that opens the modal. Rendered via `asChild`, so pass a single focusable node. */
  trigger?: React.ReactNode;
  /** Optional leading icon, shown in a tonal badge beside the title. */
  icon?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Footer actions, e.g. Cancel / Save buttons. */
  footer?: React.ReactNode;
  children?: React.ReactNode;
  /** Controlled open state. Omit for an uncontrolled modal driven by `trigger`. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showCloseButton?: boolean;
  className?: string;
}

/**
 * A large dialog for richer content — multi-column forms, detail panels, previews.
 * The body scrolls when content exceeds the viewport. For short prompts use {@link CompactModal}.
 */
export function WideModal({
  trigger,
  icon,
  title,
  description,
  footer,
  children,
  open,
  onOpenChange,
  showCloseButton = true,
  className,
}: WideModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent
        showCloseButton={showCloseButton}
        className={cn(
          'flex h-[85vh] max-h-[85vh] w-[85vw] max-w-[85vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-[85vw]',
          className,
        )}
      >
        {(title || description) && (
          <DialogHeader className="shrink-0 border-b border-border/60 px-6 py-4 pr-12 text-left sm:flex-row sm:items-center sm:gap-3.5 sm:space-y-0">
            {icon ? (
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary [&_svg]:size-[1.125rem]">
                {icon}
              </span>
            ) : null}
            <div className="space-y-1">
              {title ? <DialogTitle className="text-base">{title}</DialogTitle> : null}
              {description ? <DialogDescription>{description}</DialogDescription> : null}
            </div>
          </DialogHeader>
        )}
        {/* Scroll region — fades at top/bottom hint there's more content. */}
        <div className="relative flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto overscroll-contain px-6 py-5">{children}</div>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-background to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-background to-transparent" />
        </div>
        {footer ? (
          <DialogFooter className="shrink-0 border-t border-border/60 bg-muted/30 px-6 py-4">
            {footer}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
