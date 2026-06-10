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

interface CompactModalProps {
  /** Element that opens the modal. Rendered via `asChild`, so pass a single focusable node. */
  trigger?: React.ReactNode;
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
 * A small, single-column dialog for quick confirmations and short forms.
 * For richer, multi-column content use {@link WideModal}.
 */
export function CompactModal({
  trigger,
  title,
  description,
  footer,
  children,
  open,
  onOpenChange,
  showCloseButton = true,
  className,
}: CompactModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent showCloseButton={showCloseButton} className={cn('sm:max-w-md', className)}>
        {(title || description) && (
          <DialogHeader>
            {title ? <DialogTitle>{title}</DialogTitle> : null}
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>
        )}
        {children}
        {footer ? <DialogFooter>{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  );
}
