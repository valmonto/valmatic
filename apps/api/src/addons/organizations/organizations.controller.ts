import { Controller, Post, Res } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { ActiveUser, COOKIE_OPTIONS, COOKIE_TTL, Permissions, ZodRequest } from '@pkg/server';
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
  constructor(private readonly organizations: OrganizationsService) {}

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
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<SwitchOrgResponse> {
    const { accessToken, refreshToken } = await this.organizations.switchOrg(activeUser, dto.orgId);

    reply.setCookie('accessToken', accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: COOKIE_TTL.ACCESS_TOKEN,
    });
    reply.setCookie('refreshToken', refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: COOKIE_TTL.REFRESH_TOKEN,
    });
    return {};
  }
}
