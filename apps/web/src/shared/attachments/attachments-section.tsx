import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FileText, Loader2, Paperclip, Plus, Trash2 } from 'lucide-react';
import type { AttachmentWithUrls } from '@pkg/contracts';
import { k } from '@pkg/locales';
import { Button } from '@/components/ui/button';
import { useAttachments, useDeleteAttachment, useUploadAttachment } from './use-attachments';
import { AttachmentGalleryDialog } from './attachment-gallery-dialog';

function prettySize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentTile({
  item,
  onOpen,
  onDelete,
  deleting,
}: {
  item: AttachmentWithUrls;
  onOpen: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const { t } = useTranslation();
  const { attachment, readUrl } = item;
  const isImage = attachment.kind === 'image';

  return (
    <div className="group relative overflow-hidden rounded-lg border bg-card">
      {/* Opens the gallery — never a download; the gallery holds the one
          explicit Download action. */}
      {isImage ? (
        <button type="button" onClick={onOpen} className="block w-full cursor-zoom-in">
          <img
            src={readUrl}
            alt={attachment.fileName ?? 'attachment'}
            className="h-24 w-full object-cover"
          />
        </button>
      ) : (
        <button
          type="button"
          onClick={onOpen}
          className="flex h-24 w-full flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground"
          title={t(k.attachments.title)}
        >
          <FileText className="size-6" />
          <Download className="size-3.5" />
        </button>
      )}
      <div className="flex items-center gap-1 px-2 py-1">
        <span className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">
          {attachment.fileName ?? attachment.mimeType} · {prettySize(attachment.sizeBytes)}
        </span>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="text-muted-foreground/60 opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive pointer-coarse:opacity-100"
          aria-label={t(k.common.actions.delete)}
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

/**
 * Generic attachments block for any subject: uploads go straight to object
 * storage via presigned URLs (the API never touches the bytes) and only
 * become visible once the server has verified the upload. Drop it into a
 * detail view with the subject's type and id — the subject type must have a
 * resolver registered in the API's AttachmentsModule.
 */
export function AttachmentsSection({
  subjectType,
  subjectId,
}: {
  subjectType: string;
  subjectId: string;
}) {
  const { t } = useTranslation();
  const { data, mutate } = useAttachments(subjectType, subjectId);
  const uploadCtl = useUploadAttachment(subjectType, () => mutate());
  const deleteCtl = useDeleteAttachment(() => mutate());
  const fileInput = useRef<HTMLInputElement>(null);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);

  const items = data?.data ?? [];

  const onPick = async (files: FileList | null) => {
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      await uploadCtl.upload(subjectId, file);
    }
    if (fileInput.current) fileInput.current.value = '';
  };

  return (
    <section className="space-y-2">
      <h4 className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        <Paperclip className="size-3.5" />
        {t(k.attachments.title)}
      </h4>

      {items.length === 0 && !uploadCtl.isUploading && (
        <p className="text-sm text-muted-foreground">{t(k.attachments.empty)}</p>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {items.map((item, itemIndex) => (
          <AttachmentTile
            key={item.attachment.id}
            item={item}
            deleting={deleteCtl.isDeleting}
            onOpen={() => setGalleryIndex(itemIndex)}
            onDelete={() => void deleteCtl.remove(item.attachment.id)}
          />
        ))}
      </div>

      <AttachmentGalleryDialog
        items={items}
        index={galleryIndex}
        onClose={() => setGalleryIndex(null)}
        onSelect={setGalleryIndex}
      />

      {uploadCtl.error && <p className="text-sm text-destructive">{t(uploadCtl.error.message)}</p>}

      <input
        ref={fileInput}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => void onPick(e.target.files)}
      />
      <Button
        size="sm"
        variant="outline"
        disabled={uploadCtl.isUploading}
        onClick={() => fileInput.current?.click()}
      >
        {uploadCtl.isUploading ? (
          <Loader2 className="size-4 mr-1 animate-spin" />
        ) : (
          <Plus className="size-4 mr-1" />
        )}
        {t(uploadCtl.isUploading ? k.attachments.uploading : k.attachments.add)}
      </Button>
    </section>
  );
}
