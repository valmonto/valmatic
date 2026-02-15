import { type IAuthProvider } from '../auth-provider';
import type {
  ActiveUser,
  IamIssueTokensRequest,
  IamIssueTokensResponse,
  IamVerifyTokenRequest,
  IamVerifyTokenResponse,
  IamRevokeTokenRequest,
  IamRevokeTokenResponse,
  IamRefreshTokenRequest,
  IamRefreshTokenResponse,
} from '@pkg/contracts';
import type Redis from 'ioredis';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'node:crypto';
import { k } from '@pkg/locales';
import { IAM_REDIS } from '../../iam.redis';
import { ORG_ACCESS, type IOrgAccessProvider } from '../org-access-provider';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

interface SessionData extends ActiveUser {
  sessionStart: number;
}

@Injectable()
export class LocalAuthProvider implements IAuthProvider {
  private readonly accessTokenTtl: number;
  private readonly maxSessionTtl: number;

  constructor(
    @InjectPinoLogger() private logger: PinoLogger,
    @Inject(IAM_REDIS) private readonly redis: Redis,
    private readonly jwtService: JwtService,
    @Inject(ORG_ACCESS)
    private readonly orgAccess: IOrgAccessProvider,
    private readonly configService: ConfigService,
  ) {
    this.accessTokenTtl = this.configService.get<number>('IAM_ACCESS_TOKEN_TTL', 900);
    this.maxSessionTtl = this.configService.get<number>('IAM_MAX_SESSION_TTL', 86400);
  }

  async issueTokens(dto: IamIssueTokensRequest): Promise<IamIssueTokensResponse> {
    const refreshToken = randomBytes(32).toString('hex');
    const sessionStart = Date.now();
    const iat = Math.floor(Date.now() / 1000);

    const accessToken = await this.jwtService.signAsync(
      { sub: dto.userId, orgId: dto.orgId, role: dto.role, iat },
      { expiresIn: this.accessTokenTtl },
    );

    const sessionData: SessionData = { ...dto, sessionStart };
    const refreshKey = this.refreshTokenKey(refreshToken);

    // Store session and track in user's session index
    await this.redis
      .multi()
      .set(refreshKey, JSON.stringify(sessionData), 'EX', this.maxSessionTtl)
      .sadd(this.userSessionsKey(dto.userId), refreshKey)
      .expire(this.userSessionsKey(dto.userId), this.maxSessionTtl)
      .exec();

    return { accessToken, refreshToken };
  }

  async verifyToken(dto: IamVerifyTokenRequest): Promise<IamVerifyTokenResponse> {
    const payload = await this.jwtService.verifyAsync(dto.token);
    return { userId: payload.sub };
  }

  async revokeToken(dto: IamRevokeTokenRequest): Promise<IamRevokeTokenResponse> {
    const key = this.refreshTokenKey(dto.token);
    const data = await this.redis.get(key);

    if (!data) {
      throw new UnauthorizedException(k.auth.errors.invalidRefreshToken);
    }

    const session: SessionData = JSON.parse(data);

    // Delete token and remove from user's session index
    await this.redis.multi().del(key).srem(this.userSessionsKey(session.userId), key).exec();

    return { userId: session.userId };
  }

  async refresh(dto: IamRefreshTokenRequest): Promise<IamRefreshTokenResponse> {
    const key = this.refreshTokenKey(dto.refreshToken);
    const data = await this.redis.get(key);

    if (!data) {
      throw new UnauthorizedException(k.auth.errors.invalidRefreshToken);
    }

    const session: SessionData = JSON.parse(data);
    const elapsed = Date.now() - session.sessionStart;

    if (elapsed >= this.maxSessionTtl * 1000) {
      await this.redis.del(key);
      throw new UnauthorizedException(k.auth.errors.sessionExpiredPleaseLogin);
    }

    // Verify the user still belongs to this org with a valid role

    const access = await this.orgAccess.verifyAccess({
      userId: session.userId,
      orgId: session.orgId,
    });
    if (!access) {
      await this.redis.del(key);
      throw new UnauthorizedException(k.auth.errors.orgAccessRevoked);
    }
    // Update role to current value from DB
    session.role = access.role;

    // Issue new tokens, preserving original session start
    const newRefreshToken = randomBytes(32).toString('hex');
    const newKey = this.refreshTokenKey(newRefreshToken);
    const remainingTtl = Math.floor((this.maxSessionTtl * 1000 - elapsed) / 1000);
    const iat = Math.floor(Date.now() / 1000);

    const accessToken = await this.jwtService.signAsync(
      { sub: session.userId, orgId: session.orgId, role: session.role, iat },
      { expiresIn: this.accessTokenTtl },
    );

    // Rotate: delete old token, add new token, update session index
    const userSessionsKey = this.userSessionsKey(session.userId);
    await this.redis
      .multi()
      .del(key)
      .set(newKey, JSON.stringify(session), 'EX', remainingTtl)
      .srem(userSessionsKey, key)
      .sadd(userSessionsKey, newKey)
      .expire(userSessionsKey, remainingTtl)
      .exec();

    return { accessToken, refreshToken: newRefreshToken };
  }

  async revokeAllForUser(userId: string): Promise<void> {
    // Store logout timestamp to invalidate all existing access tokens
    const logoutTimestamp = Math.floor(Date.now() / 1000);
    const logoutKey = this.logoutAllKey(userId);
    const userSessionsKey = this.userSessionsKey(userId);

    // Get all session keys for this user from the index
    const sessionKeys = await this.redis.smembers(userSessionsKey);

    if (sessionKeys.length > 0) {
      // Delete all session tokens and the index in one transaction
      await this.redis
        .multi()
        .set(logoutKey, logoutTimestamp.toString(), 'EX', this.maxSessionTtl)
        .del(...sessionKeys)
        .del(userSessionsKey)
        .exec();
    } else {
      // No sessions to revoke, just set the logout timestamp
      await this.redis.set(logoutKey, logoutTimestamp.toString(), 'EX', this.maxSessionTtl);
    }
  }

  async isTokenIssuedBeforeLogoutAll(userId: string, issuedAt: number): Promise<boolean> {
    const key = this.logoutAllKey(userId);

    // If issuedAt is missing, treat as invalid (should be invalidated)
    if (issuedAt === undefined || issuedAt === null) {
      return true;
    }

    const logoutTimestamp = await this.redis.get(key);

    if (!logoutTimestamp) {
      return false;
    }

    const logoutTime = parseInt(logoutTimestamp, 10);
    const result = issuedAt <= logoutTime;

    // Use <= to handle same-second edge case
    return result;
  }

  async blacklistAccessToken(token: string): Promise<void> {
    // Decode (without verifying — it may already be expired) to get the exp claim
    const payload = this.jwtService.decode(token) as { exp?: number } | null;
    if (!payload?.exp) return;

    const remainingTtl = payload.exp - Math.floor(Date.now() / 1000);
    if (remainingTtl <= 0) return; // Already expired, no need to blacklist

    await this.redis.set(this.blacklistKey(token), '1', 'EX', remainingTtl);
  }

  async isAccessTokenBlacklisted(token: string): Promise<boolean> {
    const result = await this.redis.get(this.blacklistKey(token));
    return result !== null;
  }

  private blacklistKey(token: string) {
    return `iam:blacklist:${token}`;
  }

  private refreshTokenKey(token: string) {
    return `iam:refresh:${token}`;
  }

  private logoutAllKey(userId: string) {
    return `iam:logout-all:${userId}`;
  }

  private userSessionsKey(userId: string) {
    return `iam:user-sessions:${userId}`;
  }
}
