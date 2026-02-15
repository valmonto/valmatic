import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { IAM_REDIS, IamService, SECURITY_CONFIG } from '@pkg/server';
import { k } from '@pkg/locales';
import {
  type ActiveUser,
  type ChangePasswordRequest,
  type CurrentUserResponse,
  CurrentUserResponseSchema,
  type LoginRequest,
  type LoginResponse,
  type RegisterRequest,
  type RegisterResponse,
} from '@pkg/contracts';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuthRepository } from './auth.repository';
import * as bcrypt from 'bcryptjs';
import type Redis from 'ioredis';

const { BCRYPT_ROUNDS, LOGIN_MAX_ATTEMPTS, LOGIN_LOCKOUT_SECONDS } = SECURITY_CONFIG;

@Injectable()
export class AuthService {
  constructor(
    private readonly iamService: IamService,
    private readonly authRepository: AuthRepository,
    @Inject(IAM_REDIS) private readonly redis: Redis,
    @InjectPinoLogger(AuthService.name) private readonly logger: PinoLogger,
  ) {}

  async register(
    dto: RegisterRequest,
  ): Promise<{ response: RegisterResponse; accessToken: string; refreshToken: string }> {
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
      role: orgUser.role,
    };

    const tokens = await this.iamService.auth.issueTokens(activeUser);

    this.logger.debug({ userId: user.id, email: user.email }, 'User registered successfully');

    return {
      response: { user: { id: user.id, email: user.email, name: user.name } },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  private loginAttemptsKey(email: string): string {
    return `iam:login-attempts:${email.toLowerCase()}`;
  }

  async login(
    dto: LoginRequest,
  ): Promise<{ response: LoginResponse; accessToken: string; refreshToken: string }> {
    const user = await this.authRepository.findUserByEmail(dto.email);

    // Only check lockout for existing users — no Redis writes for non-existent emails
    if (user) {
      const key = this.loginAttemptsKey(dto.email);
      const attempts = await this.redis.get(key);

      if (attempts && parseInt(attempts, 10) >= LOGIN_MAX_ATTEMPTS) {
        this.logger.warn({ email: dto.email }, 'Login blocked — account temporarily locked');
        throw new UnauthorizedException(k.auth.errors.tooManyAttempts);
      }
    }

    if (!user) {
      await bcrypt.compare(
        dto.password,
        '$2a$12$000000000000000000000000000000000000000000000000000000',
      );
      throw new UnauthorizedException(k.auth.errors.invalidEmailOrPassword);
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      // Increment failed attempts for this email
      const key = this.loginAttemptsKey(dto.email);
      const current = await this.redis.incr(key);
      if (current === 1) {
        await this.redis.expire(key, LOGIN_LOCKOUT_SECONDS);
      }
      this.logger.warn({ email: dto.email, attempts: current }, 'Failed login attempt');
      throw new UnauthorizedException(k.auth.errors.invalidEmailOrPassword);
    }

    // Success — clear failed attempts
    await this.redis.del(this.loginAttemptsKey(dto.email));

    const orgAccess = await this.authRepository.findFirstOrgForUser(user.id);
    if (!orgAccess) {
      throw new UnauthorizedException(k.auth.errors.noOrgAccess);
    }

    const activeUser: ActiveUser = {
      orgId: orgAccess.orgId,
      userId: orgAccess.userId,
      role: orgAccess.role,
    };

    const tokens = await this.iamService.auth.issueTokens(activeUser);

    this.logger.debug({ userId: user.id, email: user.email }, 'User logged in successfully');

    return {
      response: { user: { id: user.id, email: user.email, name: user.name } },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async getMe(activeUser: ActiveUser): Promise<CurrentUserResponse> {
    const userInfo = await this.authRepository.findUserWithOrg(activeUser.userId, activeUser.orgId);

    if (!userInfo) {
      throw new UnauthorizedException();
    }

    return CurrentUserResponseSchema.parse(userInfo);
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
