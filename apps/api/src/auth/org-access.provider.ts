import { Injectable } from '@nestjs/common';
import type { OrganizationUserRole, SystemRole } from '@pkg/contracts';
import { AuthRepository } from './auth.repository';
import { IOrgAccessProvider } from '@pkg/server';

@Injectable()
export class OrgAccessProvider implements IOrgAccessProvider {
  constructor(private readonly authRepository: AuthRepository) {}

  async verifyAccess({
    userId,
    orgId,
  }: {
    userId: string;
    orgId: string;
  }): Promise<{ orgRole: OrganizationUserRole; systemRole: SystemRole } | null> {
    const access = await this.authRepository.findUserWithOrg(userId, orgId);
    if (!access) return null;

    return { orgRole: access.role, systemRole: access.systemRole };
  }
}
