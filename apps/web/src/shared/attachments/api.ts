import type {
  ConfirmAttachmentRequest,
  ConfirmAttachmentResponse,
  CreateAttachmentUploadRequest,
  CreateAttachmentUploadResponse,
  DeleteAttachmentRequest,
  DeleteAttachmentResponse,
  ListAttachmentsRequest,
  ListAttachmentsResponse,
} from '@pkg/contracts';
import { http, type HttpClient } from '@/shared/api/http';

/** The client half of the three-step upload protocol (docs/storage.md). */
export const attachmentsResource = (client: HttpClient) => ({
  createUpload: (dto: CreateAttachmentUploadRequest): Promise<CreateAttachmentUploadResponse> =>
    client.post('/api/attachments/uploads', dto),

  confirm: (dto: ConfirmAttachmentRequest): Promise<ConfirmAttachmentResponse> =>
    client.post(`/api/attachments/${dto.id}/confirm`, dto),

  list: (dto: ListAttachmentsRequest): Promise<ListAttachmentsResponse> =>
    client.get('/api/attachments', { params: dto }),

  remove: (dto: DeleteAttachmentRequest): Promise<DeleteAttachmentResponse> =>
    client.delete(`/api/attachments/${dto.id}`),
});

/** Bound instance the shared hooks use. */
export const attachmentsApi = attachmentsResource(http);
