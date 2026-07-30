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

  /**
   * Deletes the ACTIVE organization — the only one the route can address — so
   * the session's orgId always points at a deleted row afterwards. Left alone,
   * every org-scoped query then quietly returns empty until the next token
   * refresh logs the user out. Instead the session is re-issued against a
   * remaining organization, which the deleting-your-only-org check guarantees
   * exists.
   */
  async deleteOrg(
    activeUser: ActiveUser,
    orgId: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
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

    const remaining = await this.orgRepository.findOrgsForUser(activeUser.userId);
    const next = remaining[0];
    if (!next) {
      // Unreachable while the only-org check above holds; fail loudly if it stops holding.
      throw new InternalServerErrorException(k.common.errors.failedToRetrieveOrg);
    }

    const tokens = await this.iamService.auth.issueTokens({
      userId: activeUser.userId,
      orgId: next.id,
      orgRole: next.role,
      systemRole: activeUser.systemRole,
    });

    this.logger.info({ orgId, nextOrgId: next.id }, 'Organization deleted, session re-homed');

    return tokens;
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
