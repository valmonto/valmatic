import { Controller, Delete, Get, Param, Patch, Post, Res } from '@nestjs/common';
import { OrgService } from './org.service';
import { ActiveUser, Permissions, ZodRequest, COOKIE_OPTIONS, COOKIE_TTL } from '@pkg/server';
import {
  CreateOrgRequest,
  CreateOrgRequestSchema,
  CreateOrgResponse,
  DeleteOrgResponse,
  GetOrgByIdResponse,
  ListOrgsResponse,
  UpdateOrgRequest,
  UpdateOrgRequestSchema,
  UpdateOrgResponse,
  SwitchOrgRequest,
  SwitchOrgRequestSchema,
  SwitchOrgResponse,
  type ActiveUser as ActiveUserType,
} from '@pkg/contracts';
import type { FastifyReply } from 'fastify';

@Controller('orgs')
export class OrgController {
  constructor(private readonly orgService: OrgService) {}

  @Get()
  @Permissions('org:list')
  async list(@ActiveUser() activeUser: ActiveUserType): Promise<ListOrgsResponse> {
    return this.orgService.listOrgs(activeUser);
  }

  @Get(':id')
  @Permissions('org:read')
  async get(
    @Param('id') id: string,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<GetOrgByIdResponse> {
    return this.orgService.getOrgById(activeUser, id);
  }

  @Post()
  @Permissions('org:create')
  async create(
    @ZodRequest(CreateOrgRequestSchema) dto: CreateOrgRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<CreateOrgResponse> {
    return this.orgService.createOrg(activeUser, dto);
  }

  @Patch(':id')
  @Permissions('org:update')
  async update(
    @Param('id') id: string,
    @ZodRequest(UpdateOrgRequestSchema.omit({ id: true })) dto: Omit<UpdateOrgRequest, 'id'>,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<UpdateOrgResponse> {
    return this.orgService.updateOrg(activeUser, { ...dto, id });
  }

  @Delete(':id')
  @Permissions('org:delete')
  async delete(
    @Param('id') id: string,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<DeleteOrgResponse> {
    await this.orgService.deleteOrg(activeUser, id);
    return {};
  }

  @Post('switch')
  @Permissions('org:switch')
  async switch(
    @ZodRequest(SwitchOrgRequestSchema) dto: SwitchOrgRequest,
    @ActiveUser() activeUser: ActiveUserType,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<SwitchOrgResponse> {
    const { accessToken, refreshToken } = await this.orgService.switchOrg(activeUser, dto.orgId);

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
