import { Controller, Delete, Get, Post } from '@nestjs/common';
import { ActiveUser, SystemRole, SystemRoles, ZodRequest } from '@pkg/server';
import {
  type CreateApiKeyRequest,
  CreateApiKeyRequestSchema,
  CreateApiKeyResponse,
  type ListApiKeysRequest,
  ListApiKeysRequestSchema,
  ListApiKeysResponse,
  type RevokeApiKeyRequest,
  RevokeApiKeyRequestSchema,
  RevokeApiKeyResponse,
  type ActiveUser as ActiveUserType,
} from '@pkg/contracts';
import { ApiKeyService } from './api-key.service';

/**
 * Platform surface: minting an MCP key is choosing what an agent can reach,
 * so it sits with the platform admin, not with any org role.
 */
@Controller('admin/api-keys')
@SystemRoles(SystemRole.ADMIN)
export class AdminApiKeyController {
  constructor(private readonly apiKeys: ApiKeyService) {}

  @Get()
  async list(
    @ZodRequest(ListApiKeysRequestSchema) dto: ListApiKeysRequest,
  ): Promise<ListApiKeysResponse> {
    return this.apiKeys.list();
  }

  @Post()
  async create(
    @ZodRequest(CreateApiKeyRequestSchema) dto: CreateApiKeyRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<CreateApiKeyResponse> {
    return this.apiKeys.create(activeUser.userId, dto);
  }

  @Delete(':id')
  async revoke(
    @ZodRequest(RevokeApiKeyRequestSchema) dto: RevokeApiKeyRequest,
  ): Promise<RevokeApiKeyResponse> {
    await this.apiKeys.revoke(dto.id);
    return {};
  }
}
