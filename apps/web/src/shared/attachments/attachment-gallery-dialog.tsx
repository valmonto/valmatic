import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Download, FileText } from 'lucide-react';
import type { AttachmentWithUrls } from '@pkg/contracts';
import { k } from '@pkg/locales';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/shared/lib/utils';

/**
 * The attachment viewer: preview on the left, the full set on the right,
 * click (or arrow keys) to move between them — attachments are evidence to
 * be READ in place, not downloads. The presigned URL's forced-download
 * disposition only applies to navigation, so <img> renders it fine; the
 * explicit Download button is the one deliberate way out.
 */
export function AttachmentGalleryDialog({
  items,
  index,
  onClose,
  onSelect,
}: {
  items: AttachmentWithUrls[];
  index: number | null;
  onClose: () => void;
  onSelect: (index: number) => void;
}) {
  const { t } = useTranslation();
  const open = index !== null && items.length > 0;
  const current = open ? items[Math.min(index, items.length - 1)] : undefined;

  const step = useCallback(
    (delta: number) => {
      if (index === null || items.length === 0) return;
      onSelect((index + delta + items.length) % items.length);
    },
    [index, items.length, onSelect],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') step(1);
      if (event.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, step]);

  if (!current) return null;
  const { attachment, readUrl } = current;

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      {/* Near-fullscreen: evidence wants pixels. Sized here via className
          overrides (tailwind-merge in cn) — the base Dialog stays untouched. */}
      <DialogContent className="flex h-[92vh] w-[92vw] max-w-[92vw] flex-col sm:max-w-[92vw]">
        <DialogHeader className="shrink-0">
          <DialogTitle className="truncate pr-8 font-mono text-sm">
            {attachment.fileName ?? attachment.mimeType}
          </DialogTitle>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 gap-4 md:grid-cols-[minmax(0,1fr)_240px]">
          {/* Preview */}
          <div className="flex min-h-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/30">
            {attachment.kind === 'image' ? (
              <img
                src={readUrl}
                alt={attachment.fileName ?? 'attachment'}
                className="max-h-full w-auto max-w-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <FileText className="size-12" />
                <Button asChild variant="outline" size="sm">
                  <a href={readUrl} target="_blank" rel="noreferrer">
                    <Download className="size-4" />
                    {t(k.attachments.download)}
                  </a>
                </Button>
              </div>
            )}
          </div>

          {/* The set — click any to swap the preview */}
          <div className="flex min-h-0 flex-col gap-2 overflow-y-auto pr-1">
            {items.map((item, itemIndex) => (
              <button
                key={item.attachment.id}
                type="button"
                onClick={() => onSelect(itemIndex)}
                className={cn(
                  'overflow-hidden rounded-lg border text-left transition-colors hover:bg-muted/50',
                  itemIndex === index && 'ring-2 ring-primary',
                )}
              >
                {item.attachment.kind === 'image' ? (
                  <img
                    src={item.readUrl}
                    alt={item.attachment.fileName ?? 'attachment'}
                    className="h-20 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-20 items-center justify-center text-muted-foreground">
                    <FileText className="size-6" />
                  </div>
                )}
                <p className="truncate px-2 py-1 text-[11px] text-muted-foreground">
                  {item.attachment.fileName ?? item.attachment.mimeType}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => step(-1)} disabled={items.length < 2}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => step(1)} disabled={items.length < 2}>
            <ChevronRight className="size-4" />
          </Button>
          <span className="text-xs text-muted-foreground tabular-nums">
            {(index ?? 0) + 1} / {items.length}
          </span>
          <Button asChild variant="outline" size="sm" className="ml-auto">
            <a href={readUrl} target="_blank" rel="noreferrer">
              <Download className="size-4" />
              {t(k.attachments.download)}
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
