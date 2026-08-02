import { z } from 'zod';
import { ATTACHMENT_KINDS, ATTACHMENT_STATUSES } from '../constants/attachment';

// --- Enums (value sets from ../constants, defined exactly once) ---
export const AttachmentKindSchema = z.enum(ATTACHMENT_KINDS);
export const AttachmentStatusSchema = z.enum(ATTACHMENT_STATUSES);

/**
 * Subject types are the app's knowledge, not the template's: the module is
 * domain-blind, so the schema only bounds the shape. An unregistered type is
 * rejected by the service (400) via the subject-resolver registry.
 */
export const AttachmentSubjectTypeSchema = z
  .string()
  .min(1)
  .max(32)
  .regex(/^[a-z][a-z0-9_-]*$/, 'subjectType must be a lowercase identifier');

export type AttachmentKind = z.infer<typeof AttachmentKindSchema>;
export type AttachmentStatus = z.infer<typeof AttachmentStatusSchema>;
export type AttachmentSubjectType = z.infer<typeof AttachmentSubjectTypeSchema>;

// --- Entity ---
export const AttachmentSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  subjectType: AttachmentSubjectTypeSchema,
  subjectId: z.string().uuid(),
  kind: AttachmentKindSchema,
  status: AttachmentStatusSchema,
  fileName: z.string().nullable(),
  mimeType: z.string(),
  sizeBytes: z.number().int(),
  waveform: z.array(z.number()).nullable(),
  hasThumbnail: z.boolean(),
  uploadedBy: z.string().uuid(),
  expiresAt: z.string().nullable(),
  createdAt: z.string(),
});

export type Attachment = z.infer<typeof AttachmentSchema>;

// --- Declare an upload (three-step protocol, step 1) ---
export const CreateAttachmentUploadRequestSchema = z
  .object({
    subjectType: AttachmentSubjectTypeSchema,
    subjectId: z.string().uuid(),
    kind: AttachmentKindSchema,
    fileName: z.string().min(1).max(255).optional(),
    mimeType: z.string().min(1).max(255),
    sizeBytes: z.number().int().positive(),
    withThumbnail: z.boolean().optional().default(false),
    waveform: z.array(z.number().int().min(0).max(100)).max(200).optional(),
  })
  .strict();

export const CreateAttachmentUploadResponseSchema = z.object({
  attachment: AttachmentSchema,
  uploadUrl: z.string(),
  thumbnailUploadUrl: z.string().nullable(),
});

export type CreateAttachmentUploadRequest = z.infer<typeof CreateAttachmentUploadRequestSchema>;
export type CreateAttachmentUploadResponse = z.infer<typeof CreateAttachmentUploadResponseSchema>;

// --- Confirm (step 3: server HEAD-verifies the object, flips to uploaded) ---
export const ConfirmAttachmentRequestSchema = z.object({ id: z.string().uuid() }).strict();
export const ConfirmAttachmentResponseSchema = AttachmentSchema;

export type ConfirmAttachmentRequest = z.infer<typeof ConfirmAttachmentRequestSchema>;
export type ConfirmAttachmentResponse = z.infer<typeof ConfirmAttachmentResponseSchema>;

// --- List for a subject (uploaded only) ---
export const ListAttachmentsRequestSchema = z
  .object({
    subjectType: AttachmentSubjectTypeSchema,
    subjectId: z.string().uuid(),
  })
  .strict();

export const AttachmentWithUrlsSchema = z.object({
  attachment: AttachmentSchema,
  readUrl: z.string(),
  thumbnailReadUrl: z.string().nullable(),
});

export const ListAttachmentsResponseSchema = z.object({
  data: z.array(AttachmentWithUrlsSchema),
});

export type ListAttachmentsRequest = z.infer<typeof ListAttachmentsRequestSchema>;
export type AttachmentWithUrls = z.infer<typeof AttachmentWithUrlsSchema>;
export type ListAttachmentsResponse = z.infer<typeof ListAttachmentsResponseSchema>;

// --- Fresh read URL for one attachment ---
export const GetAttachmentReadUrlRequestSchema = z.object({ id: z.string().uuid() }).strict();
export const GetAttachmentReadUrlResponseSchema = AttachmentWithUrlsSchema;

export type GetAttachmentReadUrlRequest = z.infer<typeof GetAttachmentReadUrlRequestSchema>;
export type GetAttachmentReadUrlResponse = z.infer<typeof GetAttachmentReadUrlResponseSchema>;

// --- Delete ---
export const DeleteAttachmentRequestSchema = z.object({ id: z.string().uuid() }).strict();
export const DeleteAttachmentResponseSchema = z.object({});

export type DeleteAttachmentRequest = z.infer<typeof DeleteAttachmentRequestSchema>;
export type DeleteAttachmentResponse = z.infer<typeof DeleteAttachmentResponseSchema>;
