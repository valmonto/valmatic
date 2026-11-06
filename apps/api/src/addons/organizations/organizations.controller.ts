import { Controller, Post, Res } from '@nestjs/common';
import { ActiveUser, AuthCookies, type HttpResponse, Permissions, ZodRequest } from '@pkg/server';
import {
  type ActiveUser as ActiveUserType,
  type CreateOrgRequest,
  CreateOrgRequestSchema,
  CreateOrgResponse,
  type SwitchOrgRequest,
  SwitchOrgRequestSchema,
  SwitchOrgResponse,
} from '@pkg/contracts';
import { OrganizationsService } from './organizations.service.js';

/** Create an organization, or move the session into another one. */
@Controller('orgs')
export class OrganizationsController {
  constructor(
    private readonly organizations: OrganizationsService,
    private readonly cookies: AuthCookies,
  ) {}

  @Post()
  @Permissions('org:create')
  async create(
    @ZodRequest(CreateOrgRequestSchema) dto: CreateOrgRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<CreateOrgResponse> {
    return this.organizations.createOrg(activeUser, dto);
  }

  @Post('switch')
  @Permissions('org:switch')
  async switch(
    @ZodRequest(SwitchOrgRequestSchema) dto: SwitchOrgRequest,
    @ActiveUser() activeUser: ActiveUserType,
    @Res({ passthrough: true }) reply: HttpResponse,
  ): Promise<SwitchOrgResponse> {
    const { accessToken, refreshToken } = await this.organizations.switchOrg(activeUser, dto.orgId);

    this.cookies.set(reply, { accessToken, refreshToken });
    return {};
  }
}
