import { Controller, Delete, Get } from '@nestjs/common';
import { OrgService } from './org.service';
import { ActiveUser, SystemRole, SystemRoles, ZodRequest } from '@pkg/server';
import {
  AdminDeleteOrgRequest,
  AdminDeleteOrgRequestSchema,
  AdminDeleteOrgResponse,
  AdminListOrgsRequest,
  AdminListOrgsRequestSchema,
  AdminListOrgsResponse,
  type ActiveUser as ActiveUserType,
} from '@pkg/contracts';

/**
 * Platform surface — the first consumer of @SystemRoles. Authorized by the
 * caller's SYSTEM role alone: org membership grants nothing here, and an org
 * OWNER without platform standing is refused.
 *
 * Cross-org by definition, so the param is `:id`, never `:orgId` — the tenant
 * rule ActiveOrgGuard enforces on `:orgId` must not apply.
 */
@Controller('admin/orgs')
@SystemRoles(SystemRole.ADMIN)
export class AdminOrgController {
  constructor(private readonly orgService: OrgService) {}

  @Get()
  async list(
    @ZodRequest(AdminListOrgsRequestSchema) dto: AdminListOrgsRequest,
  ): Promise<AdminListOrgsResponse> {
    return this.orgService.adminListOrgs(dto);
  }

  @Delete(':id')
  async delete(
    @ZodRequest(AdminDeleteOrgRequestSchema) dto: AdminDeleteOrgRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<AdminDeleteOrgResponse> {
    await this.orgService.adminDeleteOrg(activeUser, dto.id);
    return {};
  }
}
