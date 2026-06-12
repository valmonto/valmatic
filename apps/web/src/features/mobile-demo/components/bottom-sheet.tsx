import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

/**
 * Bottom sheet scoped to the phone frame. The shared Drawer (vaul) portals to
 * document.body and would cover the whole browser viewport on desktop; this
 * one positions absolutely inside the frame so the sheet slides up within the
 * device, preserving the illusion.
 */
export function BottomSheet({ open, onClose, title, description, children }: BottomSheetProps) {
  // Keep mounted briefly after close so the slide-down transition can play.
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    const timeout = setTimeout(() => setMounted(false), 250);
    return () => clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className={cn(
          'absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-250',
          open ? 'opacity-100' : 'opacity-0',
        )}
      />
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 max-h-[85%] overflow-y-auto rounded-t-3xl border-t border-border/60 bg-background shadow-[0_-12px_40px_-12px_rgba(16,18,28,0.3)] transition-transform duration-250 ease-out',
          open ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-muted-foreground/25" />
        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-1">
          <div>
            <h2 className="text-base font-semibold tracking-tight">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-muted p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>
        <div className="px-5 pt-3 pb-7">{children}</div>
      </div>
    </div>
  );
}
