import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { IamService } from '@pkg/server';
import { k } from '@pkg/locales';
import type {
  CreateOrgRequest,
  CreateOrgResponse,
  ListOrgsResponse,
  GetOrgByIdResponse,
  UpdateOrgRequest,
  UpdateOrgResponse,
  ActiveUser,
} from '@pkg/contracts';
import { OrgRepository } from './org.repository';

@Injectable()
export class OrgService {
  constructor(
    private readonly orgRepository: OrgRepository,
    private readonly iamService: IamService,
    @InjectPinoLogger(OrgService.name) private readonly logger: PinoLogger,
  ) {}

  async listOrgs(activeUser: ActiveUser): Promise<ListOrgsResponse> {
    const orgs = await this.orgRepository.findOrgsForUser(activeUser.userId);

    return {
      data: orgs.map((org) => ({
        ...org,
        createdAt: org.createdAt.toISOString(),
        updatedAt: org.updatedAt.toISOString(),
      })),
      currentOrgId: activeUser.orgId,
    };
  }

  async getOrgById(activeUser: ActiveUser, orgId: string): Promise<GetOrgByIdResponse> {
    const org = await this.orgRepository.findOrgForUser(orgId, activeUser.userId);

    if (!org) {
      throw new NotFoundException(k.orgs.errors.notFound);
    }

    return {
      ...org,
      createdAt: org.createdAt.toISOString(),
      updatedAt: org.updatedAt.toISOString(),
    };
  }

  async createOrg(activeUser: ActiveUser, dto: CreateOrgRequest): Promise<CreateOrgResponse> {
    const org = await this.orgRepository.createOrg({
      name: dto.name,
      ownerId: activeUser.userId,
    });

    this.logger.info(
      { orgId: org.id, userId: activeUser.userId },
      'Organization created',
    );

    return {
      ...org,
      createdAt: org.createdAt.toISOString(),
      updatedAt: org.updatedAt.toISOString(),
    };
  }

  async updateOrg(activeUser: ActiveUser, dto: UpdateOrgRequest): Promise<UpdateOrgResponse> {
    // Check user has access and is OWNER
    const org = await this.orgRepository.findOrgForUser(dto.id, activeUser.userId);

    if (!org) {
      throw new NotFoundException(k.orgs.errors.notFound);
    }

    if (org.role !== 'OWNER') {
      throw new ForbiddenException(k.orgs.errors.onlyOwnerCanUpdate);
    }

    await this.orgRepository.updateOrg(dto.id, { name: dto.name });

    const updated = await this.orgRepository.findOrgForUser(dto.id, activeUser.userId);

    if (!updated) {
      throw new InternalServerErrorException(k.common.errors.failedToRetrieveOrg);
    }

    this.logger.info({ orgId: dto.id }, 'Organization updated');

    return {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async deleteOrg(activeUser: ActiveUser, orgId: string): Promise<void> {
    // Check user has access and is OWNER
    const org = await this.orgRepository.findOrgForUser(orgId, activeUser.userId);

    if (!org) {
      throw new NotFoundException(k.orgs.errors.notFound);
    }

    if (org.role !== 'OWNER') {
      throw new ForbiddenException(k.orgs.errors.onlyOwnerCanDelete);
    }

    // Prevent deleting if it's the user's only org
    const orgCount = await this.orgRepository.countUserOrgs(activeUser.userId);
    if (orgCount <= 1) {
      throw new ForbiddenException(k.orgs.errors.cannotDeleteOnly);
    }

    await this.orgRepository.deleteOrg(orgId);

    this.logger.info({ orgId }, 'Organization deleted');
  }

  async switchOrg(
    activeUser: ActiveUser,
    orgId: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Verify user has access to the target org
    const role = await this.orgRepository.getUserRoleInOrg(activeUser.userId, orgId);

    if (!role) {
      throw new ForbiddenException(k.orgs.errors.noAccess);
    }

    // Issue new tokens for the new org
    const tokens = await this.iamService.auth.issueTokens({
      userId: activeUser.userId,
      orgId,
      role,
    });

    this.logger.info(
      { userId: activeUser.userId, fromOrg: activeUser.orgId, toOrg: orgId },
      'User switched organization',
    );

    return tokens;
  }
}
