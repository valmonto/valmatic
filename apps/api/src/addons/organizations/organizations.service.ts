import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { IamService, InjectLogger, PinoLogger } from '@pkg/server';
import { k } from '@pkg/locales';
import type { ActiveUser, CreateOrgRequest, CreateOrgResponse } from '@pkg/contracts';
import { OrgRepository } from '../../org/org.repository.js';

/**
 * What only a project with many organizations does: create one, switch the
 * session into another, and the platform admin's list and delete. Reading
 * and renaming an organization stay in core (OrgService).
 */
@Injectable()
export class OrganizationsService {
  constructor(
    private readonly orgRepository: OrgRepository,
    private readonly iamService: IamService,
    @InjectLogger() private readonly logger: PinoLogger,
  ) {}

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
