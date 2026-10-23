import { Controller, Get, Patch } from '@nestjs/common';
import { OrgService } from './org.service.js';
import { ActiveUser, Permissions, ZodRequest } from '@pkg/server';
import {
  type GetOrgByIdRequest,
  GetOrgByIdRequestSchema,
  GetOrgByIdResponse,
  type ListOrgsRequest,
  ListOrgsRequestSchema,
  ListOrgsResponse,
  type UpdateOrgRequest,
  UpdateOrgRequestSchema,
  UpdateOrgResponse,
  type ActiveUser as ActiveUserType,
} from '@pkg/contracts';

/**
 * The param name is load-bearing. `:orgId` puts a route under ActiveOrgGuard,
 * which forces it to equal the session's organization — so update and delete
 * only ever address the org the caller is switched into, and `@Permissions`
 * judges the right one by construction. `:id` (read) deliberately does not:
 * reading any organization you belong to is allowed from anywhere.
 */
@Controller('orgs')
export class OrgController {
  constructor(private readonly orgService: OrgService) {}

  @Get()
  @Permissions('org:list')
  async list(
    @ZodRequest(ListOrgsRequestSchema) dto: ListOrgsRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<ListOrgsResponse> {
    return this.orgService.listOrgs(activeUser);
  }

  @Get(':id')
  @Permissions('org:read')
  async get(
    @ZodRequest(GetOrgByIdRequestSchema) dto: GetOrgByIdRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<GetOrgByIdResponse> {
    return this.orgService.getOrgById(activeUser, dto.id);
  }

  @Patch(':orgId')
  @Permissions('org:update')
  async update(
    @ZodRequest(UpdateOrgRequestSchema) dto: UpdateOrgRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<UpdateOrgResponse> {
    return this.orgService.updateOrg(activeUser, dto);
  }

  // There is deliberately no DELETE here. Organization users, including
  // OWNERs, cannot delete organizations — that is a platform operation, on
  // /admin/orgs behind @SystemRoles(ADMIN), with the `organizations` add-on.

  // Creating and switching organizations come with the `organizations`
  // add-on (docs/addons.md); without it a project has one organization.
}
