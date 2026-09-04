import { Controller, Delete, Get, Post } from '@nestjs/common';
import { ActiveUser, Permissions, ZodRequest } from '@pkg/server';
import {
  ConfirmAttachmentRequestSchema,
  CreateAttachmentUploadRequestSchema,
  DeleteAttachmentRequestSchema,
  GetAttachmentReadUrlRequestSchema,
  ListAttachmentsRequestSchema,
  type ActiveUser as ActiveUserType,
  type ConfirmAttachmentRequest,
  type ConfirmAttachmentResponse,
  type CreateAttachmentUploadRequest,
  type CreateAttachmentUploadResponse,
  type DeleteAttachmentRequest,
  type DeleteAttachmentResponse,
  type GetAttachmentReadUrlRequest,
  type GetAttachmentReadUrlResponse,
  type ListAttachmentsRequest,
  type ListAttachmentsResponse,
} from '@pkg/contracts';
import { AttachmentsService } from './attachments.service.js';

@Controller('attachments')
export class AttachmentController {
  constructor(private readonly attachments: AttachmentsService) {}

  @Post('uploads')
  @Permissions('attachment:create')
  async createUpload(
    @ZodRequest(CreateAttachmentUploadRequestSchema) dto: CreateAttachmentUploadRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<CreateAttachmentUploadResponse> {
    return this.attachments.createUpload(activeUser, dto);
  }

  @Post(':id/confirm')
  @Permissions('attachment:create')
  async confirm(
    @ZodRequest(ConfirmAttachmentRequestSchema) dto: ConfirmAttachmentRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<ConfirmAttachmentResponse> {
    return this.attachments.confirm(activeUser, dto);
  }

  @Get()
  @Permissions('attachment:list')
  async list(
    @ZodRequest(ListAttachmentsRequestSchema) dto: ListAttachmentsRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<ListAttachmentsResponse> {
    return this.attachments.list(activeUser, dto);
  }

  @Get(':id/read-url')
  @Permissions('attachment:read')
  async readUrl(
    @ZodRequest(GetAttachmentReadUrlRequestSchema) dto: GetAttachmentReadUrlRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<GetAttachmentReadUrlResponse> {
    return this.attachments.readUrl(activeUser, dto);
  }

  @Delete(':id')
  @Permissions('attachment:delete')
  async delete(
    @ZodRequest(DeleteAttachmentRequestSchema) dto: DeleteAttachmentRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<DeleteAttachmentResponse> {
    await this.attachments.delete(activeUser, dto);
    return {};
  }
}
