import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { IamService, InjectLogger, PinoLogger, StorageService } from '@pkg/server';
import { k } from '@pkg/locales';
import { tryCatch } from '@pkg/utils';
import type { AccountExport, DeleteAccountRequest } from '@pkg/contracts';
import { AuthProviderService } from '../auth/provider/auth-provider.service.js';
import { AccountRepository } from './account.repository.js';

const iso = (d: Date | null): string | null => d?.toISOString() ?? null;

/**
 * The account owner's own acts on the whole account: delete it, or download
 * a copy of what is kept about them. App stores require the first; GDPR
 * requires both.
 */
@Injectable()
export class AccountService {
  constructor(
    private readonly repository: AccountRepository,
    private readonly iamService: IamService,
    private readonly storage: StorageService,
    private readonly providers: AuthProviderService,
    @InjectLogger() private readonly logger: PinoLogger,
  ) {}

  /**
   * What happens to each organization the person is in:
   * - alone in it → the organization is deleted, files and all;
   * - the only owner, with other members → refused: someone else must be
   *   made owner first, or the members would be left with no one in charge;
   * - otherwise they simply leave. If they created it, it passes to another
   *   owner (or, with none, another member) — it must name a creator.
   * Their uploads in organizations that remain stay there, unattributed.
   */
  async deleteOwnAccount(userId: string, proof: DeleteAccountRequest): Promise<void> {
    // 403, not 401: the session is fine, the confirmation is not. Clients
    // read a 401 as a dead session and sign the person out.
    if ('password' in proof) {
      const hash = await this.repository.findPasswordHash(userId);
      if (!hash) throw new UnauthorizedException(k.auth.errors.userNotFound);
      if (!hash.startsWith('$2') || !(await bcrypt.compare(proof.password, hash))) {
        throw new ForbiddenException(k.auth.errors.currentPasswordIncorrect);
      }
    } else if (!(await this.providers.provesOwner(userId, proof))) {
      // An account made through Apple or Google has no password: a fresh
      // sign-in with a provider linked to it is the confirmation.
      throw new ForbiddenException(k.auth.errors.providerNotLinked);
    }

    const memberships = await this.repository.findMemberships(userId);
    const shared = memberships.filter((m) => m.memberCount > 1);
    if (shared.some((m) => m.role === 'OWNER' && !m.otherOwnerId)) {
      throw new ConflictException(k.users.errors.lastOwnerOfSharedOrg);
    }

    const deleteOrgIds = memberships.filter((m) => m.memberCount === 1).map((m) => m.orgId);
    const handOver = shared
      .filter((m) => m.createdBy === userId)
      .map((m) => ({ orgId: m.orgId, to: (m.otherOwnerId ?? m.otherMemberId)! }));

    await this.repository.deleteAccount(userId, { deleteOrgIds, handOver });
    await this.iamService.auth.revokeAllForUser(userId);

    // The rows are gone already; the files of deleted organizations follow.
    // A failure leaves orphaned objects, never a half-deleted account.
    for (const orgId of deleteOrgIds) {
      const { e } = await tryCatch(this.storage.deleteDirectory({ prefix: `org/${orgId}/` }));
      if (e) this.logger.warn({ err: e, orgId }, 'Could not delete the files of a deleted organization');
    }

    this.logger.info(
      { userId, deletedOrgs: deleteOrgIds.length, handedOver: handOver.length },
      "Account deleted at the owner's request",
    );
  }

  async exportOwnData(userId: string): Promise<AccountExport> {
    const account = await this.repository.findAccount(userId);
    if (!account) throw new UnauthorizedException(k.auth.errors.userNotFound);

    const [memberships, notifications, uploads, providers, apiKeys] = await Promise.all([
      this.repository.findMemberships(userId),
      this.repository.findNotifications(userId),
      this.repository.findUploads(userId),
      this.repository.findSignInProviders(userId),
      this.repository.findApiKeys(userId),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      account: {
        ...account,
        emailVerifiedAt: iso(account.emailVerifiedAt),
        createdAt: account.createdAt.toISOString(),
        updatedAt: account.updatedAt.toISOString(),
      },
      organizations: memberships.map((m) => ({
        id: m.orgId,
        name: m.orgName,
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
      })),
      notifications: notifications.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() })),
      attachments: uploads.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() })),
      signInProviders: providers.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        lastSeenAt: p.lastSeenAt.toISOString(),
      })),
      apiKeys: apiKeys.map((a) => ({
        ...a,
        lastUsedAt: iso(a.lastUsedAt),
        revokedAt: iso(a.revokedAt),
        createdAt: a.createdAt.toISOString(),
      })),
    };
  }
}
