import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectLogger, PinoLogger } from '@pkg/server';
import { k } from '@pkg/locales';
import type {
  AdminListOrgsRequest,
  AdminListOrgsResponse,
  ListOrgsResponse,
  GetOrgByIdResponse,
  UpdateOrgRequest,
  UpdateOrgResponse,
  ActiveUser,
} from '@pkg/contracts';
import { OrgRepository } from './org.repository.js';

@Injectable()
export class OrgService {
  constructor(
    private readonly orgRepository: OrgRepository,
    @InjectLogger() private readonly logger: PinoLogger,
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

  /**
   * ActiveOrgGuard has already forced dto.orgId to equal the session's org, so
   * the membership and OWNER checks here judge the same organization the write
   * lands in. They stay as defence in depth, not as the primary gate.
   */
  async updateOrg(activeUser: ActiveUser, dto: UpdateOrgRequest): Promise<UpdateOrgResponse> {
    const org = await this.orgRepository.findOrgForUser(dto.orgId, activeUser.userId);

    if (!org) {
      throw new NotFoundException(k.orgs.errors.notFound);
    }

    if (org.role !== 'OWNER') {
      throw new ForbiddenException(k.orgs.errors.onlyOwnerCanUpdate);
    }

    const updated = await this.orgRepository.updateOrg(dto.orgId, { name: dto.name });

    if (!updated) {
      throw new InternalServerErrorException(k.common.errors.failedToRetrieveOrg);
    }

    this.logger.info({ orgId: dto.orgId }, 'Organization updated');

    return {
      ...updated,
      role: org.role,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /** Platform-admin view of every organization; no membership filter. */
  async adminListOrgs(dto: AdminListOrgsRequest): Promise<AdminListOrgsResponse> {
    const { data, total } = await this.orgRepository.findAllOrgs(dto);

    return {
      data: data.map((org) => ({
        ...org,
        createdAt: org.createdAt.toISOString(),
        updatedAt: org.updatedAt.toISOString(),
      })),
      meta: { total, skip: dto.skip, limit: dto.limit },
    };
  }
}
