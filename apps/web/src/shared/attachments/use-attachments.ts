import { useState } from 'react';
import type { AttachmentKind, ListAttachmentsResponse } from '@pkg/contracts';
import { attachmentKindAllowed, attachmentLimitFor } from '@pkg/contracts';
import { useAuth } from '@/shared/auth/auth-context';
import { useCachedRequest } from '@/shared/hooks/use-cached-request';
import { useCan } from '@/shared/hooks/use-permissions';
import { attachmentsApi } from './api';

const kindOf = (file: File): AttachmentKind => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return 'file';
};

/** Uploaded attachments for any subject — the generic list the section renders. */
export function useAttachments(subjectType: string, subjectId: string | null) {
  const { user } = useAuth();
  const canList = useCan('attachment:list');
  const key =
    canList && subjectId && user?.orgId
      ? `org:${user.orgId}/attachments/${subjectType}/${subjectId}`
      : null;

  return useCachedRequest<ListAttachmentsResponse>({
    key,
    fetcher: () => attachmentsApi.list({ subjectType, subjectId: subjectId! }),
  });
}

/**
 * The client side of the three-step protocol: declare, PUT the bytes
 * straight to storage against the presigned URL, confirm. The row only
 * becomes visible after the server verifies what actually landed.
 */
export function useUploadAttachment(subjectType: string, onDone: () => Promise<unknown> | void) {
  const [isUploading, setUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const upload = async (subjectId: string, file: File): Promise<boolean> => {
    setUploading(true);
    setError(null);
    try {
      const kind = kindOf(file);
      if (!attachmentKindAllowed(subjectType, kind)) {
        throw new Error('attachments.errors.kindNotAllowed');
      }
      if (file.size > attachmentLimitFor(subjectType, kind)) {
        throw new Error('attachments.errors.tooLarge');
      }
      const declared = await attachmentsApi.createUpload({
        subjectType,
        subjectId,
        kind,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        withThumbnail: false,
      });
      let put: Response;
      try {
        put = await fetch(declared.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
          body: file,
        });
      } catch {
        // The PUT goes browser → storage, not through the API. A network-level
        // failure here (fetch throws before any HTTP status) is almost always
        // the bucket's CORS rules not allowing this origin — name the cause
        // (STORAGE_CORS_ALLOWED_ORIGINS) instead of a generic "failed".
        throw new Error('attachments.errors.corsBlocked');
      }
      if (!put.ok) throw new Error('attachments.errors.uploadFailed');
      await attachmentsApi.confirm({ id: declared.attachment.id });
      await onDone();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e : new Error('attachments.errors.uploadFailed'));
      return false;
    } finally {
      setUploading(false);
    }
  };

  return { upload, isUploading, error };
}

export function useDeleteAttachment(onDone: () => Promise<unknown> | void) {
  const [isDeleting, setDeleting] = useState(false);

  const remove = async (id: string): Promise<void> => {
    setDeleting(true);
    try {
      await attachmentsApi.remove({ id });
      await onDone();
    } finally {
      setDeleting(false);
    }
  };

  return { remove, isDeleting };
}
