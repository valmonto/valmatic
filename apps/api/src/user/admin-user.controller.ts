import { Controller, HttpCode, Post } from '@nestjs/common';
import { ActiveUser, SystemRole, SystemRoles, ZodRequest } from '@pkg/server';
import {
  type ActiveUser as ActiveUserType,
  type AdminDisableUserRequest,
  AdminDisableUserRequestSchema,
  type AdminDisableUserResponse,
  type AdminEnableUserRequest,
  AdminEnableUserRequestSchema,
  type AdminEnableUserResponse,
} from '@pkg/contracts';
import { AdminUserService } from './admin-user.service.js';

/**
 * Platform surface for accounts. Authorized by the caller's SYSTEM role
 * alone: an organization OWNER without platform standing is refused, because
 * an account may belong to other organizations too.
 */
@Controller('admin/users')
@SystemRoles(SystemRole.ADMIN)
export class AdminUserController {
  constructor(private readonly admin: AdminUserService) {}

  @Post(':id/disable')
  @HttpCode(200)
  async disable(
    @ZodRequest(AdminDisableUserRequestSchema) dto: AdminDisableUserRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<AdminDisableUserResponse> {
    await this.admin.disable(activeUser, dto);
    return {};
  }

  @Post(':id/enable')
  @HttpCode(200)
  async enable(
    @ZodRequest(AdminEnableUserRequestSchema) dto: AdminEnableUserRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<AdminEnableUserResponse> {
    await this.admin.enable(activeUser, dto);
    return {};
  }
}
