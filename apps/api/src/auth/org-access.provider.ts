import { Injectable } from '@nestjs/common';
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
  }): Promise<{ role: string } | null> {
    const access = await this.authRepository.findUserWithOrg(userId, orgId);
    if (!access) return null;
    return { role: access.role };
  }
}
