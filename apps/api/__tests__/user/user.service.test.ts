import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { ActiveUser } from '@pkg/contracts';
import { FakeLogger } from '@pkg/testing';
import * as bcrypt from 'bcryptjs';
import type { PinoLogger } from 'nestjs-pino';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserService } from '@/user/user.service';
import type { UserRepository } from '@/user/user.repository';

const ORG = 'org-1';
const OTHER_ORG = 'org-2';
const now = new Date('2026-01-01T00:00:00.000Z');

const owner: ActiveUser = { userId: 'owner-1', orgId: ORG, role: 'OWNER' };
const admin: ActiveUser = { userId: 'admin-1', orgId: ORG, role: 'ADMIN' };

const member = {
  id: 'member-1',
  email: 'member@example.com',
  name: 'Member',
  displayName: null,
  phone: null,
  role: 'MEMBER' as const,
  joinedAt: now,
  createdAt: now,
  updatedAt: now,
};

const ownerRecord = { ...member, id: 'owner-2', role: 'OWNER' as const };

describe('UserService', () => {
  let service: UserService;
  let repository: Record<string, ReturnType<typeof vi.fn>>;
  let logger: FakeLogger;

  beforeEach(() => {
    repository = {
      findUsersInOrg: vi.fn().mockResolvedValue({ data: [], total: 0 }),
      findUserInOrg: vi.fn().mockResolvedValue(null),
      findUserByEmail: vi.fn().mockResolvedValue(null),
      createUserWithOrgMembership: vi.fn().mockResolvedValue(member),
      updateUser: vi.fn().mockResolvedValue(member),
      removeUserFromOrg: vi.fn().mockResolvedValue(true),
      countUserOrgs: vi.fn().mockResolvedValue(0),
      deleteUser: vi.fn().mockResolvedValue(undefined),
    };
    logger = new FakeLogger();
    service = new UserService(repository as unknown as UserRepository, logger.as<PinoLogger>());
  });

  describe('listUsers', () => {
    // Every read is scoped to the caller's organization; a query that forgot
    // this would return another tenant's rows.
    it('scopes the query to the caller organization', async () => {
      await service.listUsers(owner, { skip: 0, limit: 20, search: '' });

      expect(repository.findUsersInOrg).toHaveBeenCalledWith(ORG, expect.anything());
    });

    it('reports the paging it was asked for', async () => {
      repository.findUsersInOrg!.mockResolvedValue({ data: [member], total: 42 });

      const result = await service.listUsers(owner, { skip: 20, limit: 10, search: '' });

      expect(result.meta).toEqual({ total: 42, skip: 20, limit: 10 });
    });

    it('serialises dates so the response is JSON, not Date objects', async () => {
      repository.findUsersInOrg!.mockResolvedValue({ data: [member], total: 1 });

      const result = await service.listUsers(owner, { skip: 0, limit: 20, search: '' });

      expect(result.data[0]!.createdAt).toBe(now.toISOString());
    });
  });

  describe('getUserById', () => {
    it('looks the user up within the caller organization', async () => {
      repository.findUserInOrg!.mockResolvedValue(member);

      await service.getUserById(owner, 'member-1');

      expect(repository.findUserInOrg).toHaveBeenCalledWith('member-1', ORG);
    });

    // A user in another tenant must be indistinguishable from one that does not
    // exist, or the response confirms which ids are real.
    it('reports a user from another organization as not found', async () => {
      repository.findUserInOrg!.mockResolvedValue(null);

      await expect(service.getUserById({ ...owner, orgId: OTHER_ORG }, 'member-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createUser', () => {
    const dto = {
      email: 'new@example.com',
      password: 'Str0ng!Password',
      name: 'New',
      role: 'MEMBER' as const,
    };

    it('creates the user in the caller organization', async () => {
      await service.createUser(owner, dto);

      expect(repository.createUserWithOrgMembership).toHaveBeenCalledWith(
        expect.objectContaining({ orgId: ORG, role: 'MEMBER' }),
      );
    });

    it('hashes the password rather than storing it', async () => {
      await service.createUser(owner, dto);

      const { passwordHash } = repository.createUserWithOrgMembership!.mock.calls[0]![0] as {
        passwordHash: string;
      };
      expect(passwordHash).not.toBe(dto.password);
      expect(bcrypt.compareSync(dto.password, passwordHash)).toBe(true);
    });

    it('rejects an email already in use', async () => {
      repository.findUserByEmail!.mockResolvedValue(member);

      await expect(service.createUser(owner, dto)).rejects.toThrow(ConflictException);
      expect(repository.createUserWithOrgMembership).not.toHaveBeenCalled();
    });

    // Otherwise an ADMIN could mint an OWNER and escalate past their own role.
    it('refuses an ADMIN creating an OWNER', async () => {
      await expect(service.createUser(admin, { ...dto, role: 'OWNER' })).rejects.toThrow(
        ForbiddenException,
      );
      expect(repository.createUserWithOrgMembership).not.toHaveBeenCalled();
    });

    it('allows an OWNER to create an OWNER', async () => {
      await expect(service.createUser(owner, { ...dto, role: 'OWNER' })).resolves.toBeDefined();
    });
  });

  describe('updateUser', () => {
    it('refuses to update a user outside the caller organization', async () => {
      repository.findUserInOrg!.mockResolvedValue(null);

      await expect(service.updateUser(owner, { id: 'member-1', name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.updateUser).not.toHaveBeenCalled();
    });

    it('passes the organization through to the write', async () => {
      repository.findUserInOrg!.mockResolvedValue(member);

      await service.updateUser(owner, { id: 'member-1', name: 'X' });

      expect(repository.updateUser).toHaveBeenCalledWith('member-1', ORG, expect.anything());
    });

    // An OWNER demoting themselves could leave an organization with none.
    it('refuses an OWNER changing their own role', async () => {
      repository.findUserInOrg!.mockResolvedValue({ ...ownerRecord, id: owner.userId });

      await expect(
        service.updateUser(owner, { id: owner.userId, role: 'MEMBER' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('lets an OWNER change their own name', async () => {
      repository.findUserInOrg!.mockResolvedValue({ ...ownerRecord, id: owner.userId });

      await expect(
        service.updateUser(owner, { id: owner.userId, name: 'Renamed' }),
      ).resolves.toBeDefined();
    });

    it('refuses an ADMIN promoting someone to OWNER', async () => {
      repository.findUserInOrg!.mockResolvedValue(member);

      await expect(service.updateUser(admin, { id: 'member-1', role: 'OWNER' })).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('removeUser', () => {
    it('refuses to remove a user outside the caller organization', async () => {
      repository.findUserInOrg!.mockResolvedValue(null);

      await expect(service.removeUser(owner, 'member-1')).rejects.toThrow(NotFoundException);
      expect(repository.removeUserFromOrg).not.toHaveBeenCalled();
    });

    // Removing yourself could strand an organization with no owner.
    it('refuses self-removal', async () => {
      repository.findUserInOrg!.mockResolvedValue({ ...ownerRecord, id: owner.userId });

      await expect(service.removeUser(owner, owner.userId)).rejects.toThrow(ForbiddenException);
      expect(repository.removeUserFromOrg).not.toHaveBeenCalled();
    });

    it('refuses an ADMIN removing an OWNER', async () => {
      repository.findUserInOrg!.mockResolvedValue(ownerRecord);

      await expect(service.removeUser(admin, ownerRecord.id)).rejects.toThrow(ForbiddenException);
      expect(repository.removeUserFromOrg).not.toHaveBeenCalled();
    });

    it('removes the membership, scoped to the organization', async () => {
      repository.findUserInOrg!.mockResolvedValue(member);
      repository.countUserOrgs!.mockResolvedValue(1);

      await service.removeUser(owner, 'member-1');

      expect(repository.removeUserFromOrg).toHaveBeenCalledWith('member-1', ORG);
    });

    // The account is shared across organizations, so it may only be deleted once
    // it belongs to none — otherwise removing someone here would delete them
    // from a tenant this caller cannot see.
    it('keeps the account when the user still belongs elsewhere', async () => {
      repository.findUserInOrg!.mockResolvedValue(member);
      repository.countUserOrgs!.mockResolvedValue(1);

      await service.removeUser(owner, 'member-1');

      expect(repository.deleteUser).not.toHaveBeenCalled();
    });

    it('deletes the account once it belongs to no organization', async () => {
      repository.findUserInOrg!.mockResolvedValue(member);
      repository.countUserOrgs!.mockResolvedValue(0);

      await service.removeUser(owner, 'member-1');

      expect(repository.deleteUser).toHaveBeenCalledWith('member-1');
    });
  });
});
