import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { ActiveUser } from '@pkg/contracts';
import { FakeLogger } from '@pkg/testing';
import type { PinoLogger } from 'nestjs-pino';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminUserService } from '@/user/admin-user.service.js';
import type { UserRepository } from '@/user/user.repository.js';
import type { IamService } from '@pkg/server';

const admin: ActiveUser = {
  userId: 'admin-1',
  orgId: 'org-1',
  orgRole: 'OWNER',
  systemRole: 'ADMIN',
};

describe('AdminUserService', () => {
  let setDisabled: ReturnType<typeof vi.fn>;
  let revokeAllForUser: ReturnType<typeof vi.fn>;
  let service: AdminUserService;

  beforeEach(() => {
    setDisabled = vi.fn().mockResolvedValue(true);
    revokeAllForUser = vi.fn().mockResolvedValue(undefined);
    service = new AdminUserService(
      { setDisabled } as unknown as UserRepository,
      { auth: { revokeAllForUser } } as unknown as IamService,
      new FakeLogger().as<PinoLogger>(),
    );
  });

  it('disables an account, records who and why, and ends every session it has', async () => {
    await service.disable(admin, { id: 'user-2', reason: 'Spam' });

    expect(setDisabled).toHaveBeenCalledWith('user-2', {
      at: expect.any(Date),
      by: 'admin-1',
      reason: 'Spam',
    });
    expect(revokeAllForUser).toHaveBeenCalledWith('user-2');
  });

  // Locked out of the only screen that could undo it.
  it('refuses an admin disabling their own account, and changes nothing', async () => {
    await expect(service.disable(admin, { id: 'admin-1' })).rejects.toThrow(ForbiddenException);
    expect(setDisabled).not.toHaveBeenCalled();
    expect(revokeAllForUser).not.toHaveBeenCalled();
  });

  it('answers 404 for an account that does not exist, and revokes nothing', async () => {
    setDisabled.mockResolvedValue(false);
    await expect(service.disable(admin, { id: 'nobody' })).rejects.toThrow(NotFoundException);
    expect(revokeAllForUser).not.toHaveBeenCalled();
  });

  it('enables an account by clearing what disabled it', async () => {
    await service.enable(admin, { id: 'user-2' });
    expect(setDisabled).toHaveBeenCalledWith('user-2', null);
  });
});
