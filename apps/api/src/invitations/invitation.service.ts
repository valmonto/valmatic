import {
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { IamService, InjectLogger, PinoLogger, SECURITY_CONFIG } from '@pkg/server';
import { k } from '@pkg/locales';
import {
  INVITATION_EXPIRY_DAYS,
  type AcceptInvitationAsMemberRequest,
  type AcceptInvitationAsMemberResponse,
  type AcceptInvitationRequest,
  type ActiveUser,
  type AuthTokens,
  type CreateInvitationRequest,
  type CreateInvitationResponse,
  type Invitation,
  type InvitationStatus,
  type ListInvitationsResponse,
  type PreviewInvitationResponse,
} from '@pkg/contracts';
import { UserRepository } from '../user/user.repository.js';
import { NotificationService } from '../notifications/notification.service.js';
import {
  InvitationRepository,
  type InvitationRecord,
  type InvitationWithOrg,
} from './invitation.repository.js';

const { BCRYPT_ROUNDS } = SECURITY_CONFIG;

/** Hash a raw token the same way the api-key module does — sha256 hex. */
const hashToken = (raw: string): string => createHash('sha256').update(raw).digest('hex');

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

@Injectable()
export class InvitationService {
  constructor(
    private readonly invitations: InvitationRepository,
    private readonly users: UserRepository,
    private readonly notifications: NotificationService,
    private readonly iamService: IamService,
    private readonly configService: ConfigService,
    @InjectLogger() private readonly logger: PinoLogger,
  ) {}

  // --- Create --------------------------------------------------------------

  async create(
    activeUser: ActiveUser,
    dto: CreateInvitationRequest,
  ): Promise<CreateInvitationResponse> {
    const email = normalizeEmail(dto.email);

    // Already a member of THIS org → nothing to invite. Idempotent by refusal,
    // not by creating a dead invite.
    const existingAccount = await this.users.findUserByEmail(email);
    if (existingAccount && (await this.users.isMember(existingAccount.id, activeUser.orgId))) {
      throw new ConflictException(k.invitations.errors.alreadyMember);
    }

    // Only ever one live link per recipient: retire any prior pending invite.
    await this.invitations.supersedePendingFor(activeUser.orgId, email);

    // Unguessable raw token; only its hash is stored (api-key pattern). The raw
    // value is returned exactly once, in the link below.
    const rawToken = `inv_${randomBytes(32).toString('base64url')}`;
    const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const record = await this.invitations.create({
      orgId: activeUser.orgId,
      email,
      role: dto.orgRole,
      tokenHash: hashToken(rawToken),
      expiresAt,
      invitedBy: activeUser.userId,
    });

    // If the invitee already has an account, raise an in-app notice pointing at
    // the same link. This is the delivery seam: a future email adapter sends
    // the identical URL without any change here. No email transport exists yet
    // (GAPS.md), so the copyable link in the response is the primary channel.
    if (existingAccount) {
      const acceptUrl = this.acceptUrl(rawToken);
      await this.notifications.create({
        userId: existingAccount.id,
        orgId: activeUser.orgId,
        type: 'info',
        title: k.invitations.notice.title,
        message: k.invitations.notice.message,
        data: { invitationId: record.id, acceptUrl },
      });
    }

    this.logger.info(
      { invitationId: record.id, orgId: activeUser.orgId, invitedBy: activeUser.userId },
      'Invitation created',
    );

    return {
      ...this.toView(record),
      token: rawToken,
      acceptUrl: this.acceptUrl(rawToken),
    };
  }

  // --- List / revoke -------------------------------------------------------

  async list(activeUser: ActiveUser): Promise<ListInvitationsResponse> {
    const records = await this.invitations.listPending(activeUser.orgId, new Date());
    return { data: records.map((r) => this.toView(r)) };
  }

  async revoke(activeUser: ActiveUser, id: string): Promise<void> {
    const revoked = await this.invitations.revoke(id, activeUser.orgId);
    if (!revoked) {
      throw new NotFoundException(k.invitations.errors.notFound);
    }
    this.logger.info({ invitationId: id, orgId: activeUser.orgId }, 'Invitation revoked');
  }

  // --- Preview (public) ----------------------------------------------------

  async preview(token: string): Promise<PreviewInvitationResponse> {
    const invite = await this.invitations.findByTokenHash(hashToken(token));
    if (!invite) {
      throw new NotFoundException(k.invitations.errors.notFound);
    }

    const account = await this.users.findUserByEmail(invite.email);

    return {
      orgName: invite.orgName,
      orgRole: invite.role,
      email: invite.email,
      status: this.effectiveStatus(invite),
      requiresSignup: account === null,
    };
  }

  // --- Accept: new user (public) -------------------------------------------

  async acceptAsNewUser(dto: AcceptInvitationRequest): Promise<{
    response: {
      user: { id: string; email: string; name: string };
      orgId: string;
      orgName: string;
    };
    tokens: AuthTokens;
  }> {
    const invite = await this.invitations.findByTokenHash(hashToken(dto.token));
    this.assertRedeemable(invite);

    // The invited email — read from the invitation, NEVER from the payload —
    // must not already have an account. That path is the authenticated
    // "accept-existing" flow (log in first).
    if (await this.users.findUserByEmail(invite!.email)) {
      throw new ConflictException(k.invitations.errors.accountExists);
    }

    // Single-use gate BEFORE creating the account: only the winner proceeds, so
    // a double-submit cannot create two accounts / collide on the unique email.
    if (!(await this.invitations.consumePending(invite!.id))) {
      throw new GoneException(k.invitations.errors.alreadyAccepted);
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const created = await this.users.createUserWithOrgMembership({
      email: invite!.email,
      name: dto.name,
      passwordHash,
      orgId: invite!.orgId,
      role: invite!.role,
    });

    const tokens = await this.iamService.auth.issueTokens({
      userId: created.id,
      orgId: invite!.orgId,
      orgRole: invite!.role,
      systemRole: 'USER',
    });

    this.logger.info(
      { userId: created.id, orgId: invite!.orgId, invitationId: invite!.id },
      'Invitation accepted — new account created',
    );

    return {
      response: {
        user: { id: created.id, email: created.email, name: created.name },
        orgId: invite!.orgId,
        orgName: invite!.orgName,
      },
      tokens,
    };
  }

  // --- Accept: existing account (authenticated) ----------------------------

  async acceptAsMember(
    activeUser: ActiveUser,
    dto: AcceptInvitationAsMemberRequest,
  ): Promise<AcceptInvitationAsMemberResponse> {
    const invite = await this.invitations.findByTokenHash(hashToken(dto.token));
    if (!invite) {
      throw new NotFoundException(k.invitations.errors.notFound);
    }

    // Email-bound: the session's account email must equal the invited email. A
    // link forwarded to a different logged-in user cannot redeem it. Identity
    // comes from the verified session, never the request body.
    const account = await this.users.findAccountById(activeUser.userId);
    if (!account) {
      throw new UnauthorizedException();
    }
    if (normalizeEmail(account.email) !== normalizeEmail(invite.email)) {
      throw new ForbiddenException(k.invitations.errors.emailMismatch);
    }

    // Idempotent: already a member → consume the invite (best effort) and
    // report success, never a duplicate membership row.
    if (await this.users.isMember(activeUser.userId, invite.orgId)) {
      await this.invitations.consumePending(invite.id);
      return { orgId: invite.orgId, orgName: invite.orgName };
    }

    // Not yet a member — the invite must still be live, then win the single-use
    // gate before adding the membership.
    this.assertRedeemable(invite);
    if (!(await this.invitations.consumePending(invite.id))) {
      throw new GoneException(k.invitations.errors.alreadyAccepted);
    }

    await this.users.addOrgMembership(activeUser.userId, invite.orgId, invite.role);

    this.logger.info(
      { userId: activeUser.userId, orgId: invite.orgId, invitationId: invite.id },
      'Invitation accepted — membership added',
    );

    return { orgId: invite.orgId, orgName: invite.orgName };
  }

  // --- Helpers -------------------------------------------------------------

  private acceptUrl(rawToken: string): string {
    const base = this.configService.get<string>('WEB_APP_URL', 'http://localhost:5173');
    return `${base.replace(/\/$/, '')}/invite/${rawToken}`;
  }

  private effectiveStatus(invite: InvitationWithOrg): InvitationStatus {
    if (invite.status === 'pending' && invite.expiresAt.getTime() < Date.now()) {
      return 'expired';
    }
    return invite.status;
  }

  /** Reject anything not live: revoked, already accepted, or past expiry. */
  private assertRedeemable(invite: InvitationWithOrg | null): void {
    if (!invite) {
      throw new NotFoundException(k.invitations.errors.notFound);
    }
    const status = this.effectiveStatus(invite);
    if (status === 'revoked') {
      throw new GoneException(k.invitations.errors.revoked);
    }
    if (status === 'accepted') {
      throw new GoneException(k.invitations.errors.alreadyAccepted);
    }
    if (status === 'expired') {
      throw new GoneException(k.invitations.errors.expired);
    }
  }

  private toView(record: InvitationRecord): Invitation {
    return {
      id: record.id,
      email: record.email,
      orgRole: record.role,
      status: record.status,
      expiresAt: record.expiresAt.toISOString(),
      createdAt: record.createdAt.toISOString(),
    };
  }
}
