import {
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { FeatureFlags, IamService, SECURITY_CONFIG } from '@pkg/server';
import { ConfigService } from '@nestjs/config';
import { k } from '@pkg/locales';
import {
  type ActiveUser,
  type ChangePasswordRequest,
  type CurrentUserResponse,
  CurrentUserResponseSchema,
  getPermissionsForRole,
  type LoginRequest,
  type LoginResponse,
  type RegisterRequest,
  type RegisterResponse,
} from '@pkg/contracts';
import { InjectLogger, PinoLogger } from '@pkg/server';
import { AuthRepository } from './auth.repository.js';
import { LoginAttempts, emailFingerprint } from './login-attempts.js';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';

const { BCRYPT_ROUNDS } = SECURITY_CONFIG;

/**
 * A real bcrypt hash of a random secret, made once at start, at the cost
 * every password is hashed with. Compared against when there is no hash to
 * compare: a placeholder that is not a valid hash makes bcrypt give up at
 * once (about 1 ms against 260 ms), and the time would tell which addresses
 * have accounts.
 */
const NO_ACCOUNT_HASH = bcrypt.hashSync(randomBytes(32).toString('hex'), BCRYPT_ROUNDS);

@Injectable()
export class AuthService {
  constructor(
    private readonly iamService: IamService,
    private readonly authRepository: AuthRepository,
    private readonly featureFlags: FeatureFlags,
    private readonly configService: ConfigService,
    private readonly attempts: LoginAttempts,
    @InjectLogger() private readonly logger: PinoLogger,
  ) {}

  async register(
    dto: RegisterRequest,
  ): Promise<{ response: RegisterResponse; accessToken: string; refreshToken: string }> {
    // CLOSED by default. Most products gate account creation behind their own
    // onboarding (billing, invites); accounts otherwise come from the seed or
    // from org admins via user:create. The client hiding its register page is
    // rendering, not enforcement — this is the enforcement.
    if (!this.configService.get<boolean>('AUTH_REGISTRATION_ENABLED')) {
      throw new ForbiddenException(k.auth.errors.registrationDisabled);
    }

    const existing = await this.authRepository.findUserByEmail(dto.email);
    if (existing) {
      // Generic message to prevent email enumeration
      throw new BadRequestException(k.auth.errors.unableToCreateAccount);
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const { user, orgUser } = await this.authRepository.createUserWithOrganization({
      email: dto.email,
      name: dto.name,
      passwordHash,
      organizationName: dto.organizationName,
    });

    const activeUser: ActiveUser = {
      orgId: orgUser.orgId,
      userId: orgUser.userId,
      orgRole: orgUser.role,
      systemRole: user.systemRole,
    };

    const tokens = await this.iamService.auth.issueTokens(activeUser);

    this.logger.debug({ userId: user.id, email: user.email }, 'User registered successfully');

    return {
      response: { user: { id: user.id, email: user.email, name: user.name } },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async login(
    dto: LoginRequest,
    clientIp: string,
  ): Promise<{ response: LoginResponse; accessToken: string; refreshToken: string }> {
    // Checked and counted for every address, existing or not: "too many
    // attempts" only for real accounts would tell a stranger which exist.
    // See `LoginAttempts` for the two counts.
    const who = emailFingerprint(dto.email);
    if (await this.attempts.blocked(dto.email, clientIp)) {
      this.logger.warn({ who }, 'Login blocked — too many attempts');
      throw new UnauthorizedException(k.auth.errors.tooManyAttempts);
    }

    const user = await this.authRepository.findUserByEmail(dto.email);
    // The same bcrypt work whatever the address is: an unknown one, or an
    // account without a password hash, is compared against a real hash of
    // the same cost, so the time taken tells nothing about which exist.
    const hash = user && user.passwordHash.startsWith('$2') ? user.passwordHash : null;
    const passwordMatch = await bcrypt.compare(dto.password, hash ?? NO_ACCOUNT_HASH);
    if (!user || !hash || !passwordMatch) {
      const attempts = await this.attempts.failed(dto.email, clientIp);
      this.logger.warn({ who, attempts }, 'Failed login attempt');
      throw new UnauthorizedException(k.auth.errors.invalidEmailOrPassword);
    }

    await this.attempts.succeeded(dto.email, clientIp);

    // Checked only AFTER the password matched: "this account is disabled" is
    // for its owner, and must not tell a stranger probing addresses that the
    // account exists.
    if (user.disabledAt) {
      this.logger.warn({ userId: user.id }, 'Login refused — account disabled');
      throw new ForbiddenException(k.auth.errors.accountDisabled);
    }

    const orgAccess = await this.authRepository.findFirstOrgForUser(user.id);
    if (!orgAccess) {
      throw new UnauthorizedException(k.auth.errors.noOrgAccess);
    }

    const activeUser: ActiveUser = {
      orgId: orgAccess.orgId,
      userId: orgAccess.userId,
      orgRole: orgAccess.role,
      systemRole: user.systemRole,
    };

    const tokens = await this.iamService.auth.issueTokens(activeUser);

    this.logger.debug({ userId: user.id, email: user.email }, 'User logged in successfully');

    return {
      response: { user: { id: user.id, email: user.email, name: user.name } },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async refreshTokens(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.iamService.auth.refresh({ refreshToken });
  }

  async getMe(activeUser: ActiveUser): Promise<CurrentUserResponse> {
    const userInfo = await this.authRepository.findUserWithOrg(activeUser.userId, activeUser.orgId);

    if (!userInfo) {
      throw new UnauthorizedException();
    }

    // Resolved here rather than by the client, so what a role can do is decided
    // in one place and reaches every client on its next request.
    //
    // Permissions come from the organization role only. `systemRole` is sent so
    // a client can show or hide a platform surface, and grants nothing on its
    // own — SystemRolesGuard is what enforces it.
    const { role, ...rest } = userInfo;

    return CurrentUserResponseSchema.parse({
      ...rest,
      orgRole: role,
      providers: await this.authRepository.findProvidersForUser(activeUser.userId),
      permissions: getPermissionsForRole(role),
      // Resolved server-side like permissions, and for the same reason: every
      // client gets the same answer on its next request, and none needs a flag
      // SDK. Unconfigured analytics means every flag is off.
      features: await this.featureFlags.resolveFeatures(activeUser),
    });
  }

  async logoutAllDevices(userId: string): Promise<void> {
    await this.iamService.auth.revokeAllForUser(userId);
    this.logger.info({ userId }, 'All sessions revoked for user');
  }

  async changePassword(userId: string, dto: ChangePasswordRequest): Promise<void> {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException(k.auth.errors.userNotFound);
    }

    const passwordMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException(k.auth.errors.currentPasswordIncorrect);
    }

    const samePassword = await bcrypt.compare(dto.newPassword, user.passwordHash);
    if (samePassword) {
      throw new ConflictException(k.auth.errors.newPasswordMustDiffer);
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.authRepository.updatePassword(userId, newPasswordHash);

    // Always logout all other sessions after password change
    await this.iamService.auth.revokeAllForUser(userId);

    this.logger.info({ userId }, 'Password changed and all sessions revoked');
  }
}
