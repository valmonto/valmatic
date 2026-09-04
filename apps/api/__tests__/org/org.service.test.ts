import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { IamService } from '@pkg/server';
import type { ActiveUser } from '@pkg/contracts';
import { FakeLogger } from '@pkg/testing';
import type { PinoLogger } from 'nestjs-pino';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrgService } from '@/org/org.service';
import type { OrgRepository } from '@/org/org.repository';

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

describe('OrgService', () => {
  let service: OrgService;
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
    service = new OrgService(
      repository as unknown as OrgRepository,
      { auth: { issueTokens } } as unknown as IamService,
      new FakeLogger().as<PinoLogger>(),
    );
  });

  describe('updateOrg', () => {
    it('refuses a non-OWNER', async () => {
      repository.findOrgForUser!.mockResolvedValue({ ...orgRecord, role: 'ADMIN' });

      await expect(service.updateOrg(owner, { orgId: ORG_A, name: 'X' })).rejects.toThrow(
        ForbiddenException,
      );
      expect(repository.updateOrg).not.toHaveBeenCalled();
    });

    it('reports an organization the caller does not belong to as not found', async () => {
      repository.findOrgForUser!.mockResolvedValue(null);

      await expect(service.updateOrg(owner, { orgId: ORG_B, name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the updated organization from the single write', async () => {
      const result = await service.updateOrg(owner, { orgId: ORG_A, name: 'Renamed' });

      expect(result.name).toBe('Renamed');
      expect(result.role).toBe('OWNER');
      expect(result.createdAt).toBe(now.toISOString());
      // One membership lookup, one write — no re-read that can 500 after success.
      expect(repository.findOrgForUser).toHaveBeenCalledTimes(1);
    });
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

  describe('adminListOrgs', () => {
    it('reports every organization with the paging asked for', async () => {
      repository.findAllOrgs!.mockResolvedValue({
        data: [{ id: ORG_A, name: 'Org A', memberCount: 3, createdAt: now, updatedAt: now }],
        total: 42,
      });

      const result = await service.adminListOrgs({ skip: 20, limit: 10 });

      expect(result.meta).toEqual({ total: 42, skip: 20, limit: 10 });
      expect(result.data[0]).toMatchObject({ memberCount: 3, createdAt: now.toISOString() });
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

  describe('getOrgById', () => {
    // An org in another tenant must be indistinguishable from one that does
    // not exist.
    it('reports an organization outside the caller memberships as not found', async () => {
      repository.findOrgForUser!.mockResolvedValue(null);

      await expect(service.getOrgById(owner, ORG_B)).rejects.toThrow(NotFoundException);
    });
  });

  describe('listOrgs', () => {
    it('marks which organization is active', async () => {
      const result = await service.listOrgs(owner);

      expect(result.currentOrgId).toBe(ORG_A);
      expect(repository.findOrgsForUser).toHaveBeenCalledWith(USER);
    });
  });
});
