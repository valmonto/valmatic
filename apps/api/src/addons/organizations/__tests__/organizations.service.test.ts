import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { IamService } from '@pkg/server';
import type { ActiveUser } from '@pkg/contracts';
import { FakeLogger } from '@pkg/testing';
import type { PinoLogger } from 'nestjs-pino';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrganizationsService } from '@/addons/organizations/organizations.service.js';
import type { OrgRepository } from '@/org/org.repository.js';

const ORG_A = '11111111-1111-4111-8111-111111111111';
const ORG_B = '22222222-2222-4222-8222-222222222222';
const USER = '33333333-3333-4333-8333-333333333333';
const now = new Date('2026-01-01T00:00:00.000Z');

const owner: ActiveUser = { userId: USER, orgId: ORG_A, orgRole: 'OWNER', systemRole: 'USER' };

const orgRecord = {
  id: ORG_A,
  name: 'Org A',
  role: 'OWNER' as const,
  createdAt: now,
  updatedAt: now,
};

const TOKENS = { accessToken: 'access', refreshToken: 'refresh' };

/** Creating, switching and the platform admin's delete: the `organizations` add-on. */
describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let repository: Record<string, ReturnType<typeof vi.fn>>;
  let issueTokens: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    repository = {
      findOrgsForUser: vi.fn().mockResolvedValue([orgRecord]),
      findOrgForUser: vi.fn().mockResolvedValue(orgRecord),
      createOrg: vi.fn().mockResolvedValue(orgRecord),
      updateOrg: vi.fn().mockResolvedValue({ ...orgRecord, name: 'Renamed' }),
      deleteOrg: vi.fn().mockResolvedValue(undefined),
      countUserOrgs: vi.fn().mockResolvedValue(2),
      getUserRoleInOrg: vi.fn().mockResolvedValue('MEMBER'),
      findAllOrgs: vi.fn().mockResolvedValue({ data: [], total: 0 }),
      findOrgById: vi.fn().mockResolvedValue({ id: ORG_A, name: 'Org A' }),
    };
    issueTokens = vi.fn().mockResolvedValue(TOKENS);
    service = new OrganizationsService(
      repository as unknown as OrgRepository,
      { auth: { issueTokens } } as unknown as IamService,
      new FakeLogger().as<PinoLogger>(),
    );
  });

  describe('adminDeleteOrg', () => {
    const platformAdmin: ActiveUser = { ...owner, systemRole: 'ADMIN' };

    /**
     * Membership is deliberately NOT consulted — the route is gated by
     * @SystemRoles, and the admin typically is not a member of the org being
     * removed. What the service must still refuse is the admin's own ACTIVE
     * org, which would leave their session pointing at a deleted row.
     */
    it('refuses the organization the admin is switched into', async () => {
      await expect(service.adminDeleteOrg(platformAdmin, ORG_A)).rejects.toThrow(
        ForbiddenException,
      );
      expect(repository.deleteOrg).not.toHaveBeenCalled();
    });

    it('reports an unknown organization as not found', async () => {
      repository.findOrgById!.mockResolvedValue(null);

      await expect(service.adminDeleteOrg(platformAdmin, ORG_B)).rejects.toThrow(NotFoundException);
    });

    it('deletes an organization the admin is not a member of', async () => {
      repository.findOrgById!.mockResolvedValue({ id: ORG_B, name: 'Org B' });

      await service.adminDeleteOrg(platformAdmin, ORG_B);

      expect(repository.deleteOrg).toHaveBeenCalledWith(ORG_B);
      // No membership lookup: authorization is the system role, not a membership.
      expect(repository.findOrgForUser).not.toHaveBeenCalled();
    });
  });

  describe('switchOrg', () => {
    it('refuses an organization the caller does not belong to', async () => {
      repository.getUserRoleInOrg!.mockResolvedValue(null);

      await expect(service.switchOrg(owner, ORG_B)).rejects.toThrow(ForbiddenException);
      expect(issueTokens).not.toHaveBeenCalled();
    });

    it('issues tokens carrying the role held in the TARGET organization', async () => {
      repository.getUserRoleInOrg!.mockResolvedValue('MEMBER');

      await service.switchOrg(owner, ORG_B);

      expect(issueTokens).toHaveBeenCalledWith({
        userId: USER,
        orgId: ORG_B,
        orgRole: 'MEMBER',
        systemRole: 'USER',
      });
    });

    // systemRole belongs to the account, not the membership — switching
    // organizations must neither drop nor upgrade it.
    it('carries the system role across the switch unchanged', async () => {
      const platformAdmin: ActiveUser = { ...owner, systemRole: 'ADMIN' };

      await service.switchOrg(platformAdmin, ORG_B);

      expect(issueTokens).toHaveBeenCalledWith(expect.objectContaining({ systemRole: 'ADMIN' }));
    });
  });
});
