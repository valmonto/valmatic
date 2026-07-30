import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectLogger, PinoLogger } from '@pkg/server';
import { IamService } from '@pkg/server';
import { k } from '@pkg/locales';
import type {
  AdminListOrgsRequest,
  AdminListOrgsResponse,
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

  async createOrg(activeUser: ActiveUser, dto: CreateOrgRequest): Promise<CreateOrgResponse> {
    const org = await this.orgRepository.createOrg({
      name: dto.name,
      ownerId: activeUser.userId,
    });

    this.logger.info({ orgId: org.id, userId: activeUser.userId }, 'Organization created');

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

  /**
   * Deletes ANY organization — membership is deliberately not required, which
   * is exactly why the route sits behind @SystemRoles(ADMIN) rather than the
   * tenant permission table.
   *
   * The admin's own ACTIVE organization is refused rather than re-homed:
   * "switch first" keeps this path free of session surgery. Members of a
   * deleted organization are logged out on their next token refresh, and a
   * member whose only organization this was cannot log in afterwards — deleting
   * a customer's last workspace deprovisions that customer.
   */
  async adminDeleteOrg(activeUser: ActiveUser, orgId: string): Promise<void> {
    if (orgId === activeUser.orgId) {
      throw new ForbiddenException(k.orgs.errors.cannotDeleteActiveOrg);
    }

    const org = await this.orgRepository.findOrgById(orgId);

    if (!org) {
      throw new NotFoundException(k.orgs.errors.notFound);
    }

    await this.orgRepository.deleteOrg(orgId);

    this.logger.info(
      { orgId, orgName: org.name, deletedBy: activeUser.userId },
      'Organization deleted by platform admin',
    );
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
    // systemRole is carried over unchanged: it belongs to the account, not the
    // organization, so switching organizations must not alter it.
    const tokens = await this.iamService.auth.issueTokens({
      userId: activeUser.userId,
      orgId,
      orgRole: role,
      systemRole: activeUser.systemRole,
    });

    this.logger.info(
      { userId: activeUser.userId, fromOrg: activeUser.orgId, toOrg: orgId },
      'User switched organization',
    );

    return tokens;
  }
}
