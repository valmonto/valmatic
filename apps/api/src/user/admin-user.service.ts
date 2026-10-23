import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { ActiveUser, AdminDisableUserRequest, AdminEnableUserRequest } from '@pkg/contracts';
import { k } from '@pkg/locales';
import { IamService, InjectLogger, PinoLogger } from '@pkg/server';
import { UserRepository } from './user.repository.js';

/**
 * Disabling an account: the reversible alternative to deleting it.
 *
 * Platform-wide — an account can belong to several organizations, so turning
 * it off is not one organization's call; the controller is behind the
 * platform ADMIN role. A disabled account cannot sign in, and every session
 * it has is revoked at once. Its rows stay; enabling it gives it back as it
 * was (it then signs in again).
 */
@Injectable()
export class AdminUserService {
  constructor(
    private readonly users: UserRepository,
    private readonly iamService: IamService,
    @InjectLogger() private readonly logger: PinoLogger,
  ) {}

  async disable(admin: ActiveUser, dto: AdminDisableUserRequest): Promise<void> {
    // An admin who disables themselves is locked out of the only screen that
    // could undo it.
    if (dto.id === admin.userId) {
      throw new ForbiddenException(k.users.errors.cannotDisableSelf);
    }
    const found = await this.users.setDisabled(dto.id, {
      at: new Date(),
      by: admin.userId,
      reason: dto.reason || null,
    });
    if (!found) throw new NotFoundException(k.users.errors.notFound);

    await this.iamService.auth.revokeAllForUser(dto.id);
    this.logger.info({ userId: dto.id, disabledBy: admin.userId }, 'Account disabled');
  }

  async enable(admin: ActiveUser, dto: AdminEnableUserRequest): Promise<void> {
    const found = await this.users.setDisabled(dto.id, null);
    if (!found) throw new NotFoundException(k.users.errors.notFound);
    this.logger.info({ userId: dto.id, enabledBy: admin.userId }, 'Account enabled');
  }
}
