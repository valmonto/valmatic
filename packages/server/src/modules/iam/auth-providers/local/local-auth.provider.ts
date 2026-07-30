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
import { InjectLogger, PinoLogger } from '../../../logging';

interface SessionData extends ActiveUser {
  sessionStart: number;
}

/**
 * What a rotated refresh token's key holds during the grace window: the exact
 * pair its successor was issued. A client presenting the old token within the
 * window gets the SAME tokens back (idempotent refresh) instead of a 401.
 */
interface RotatedMarker {
  rotatedTo: { accessToken: string; refreshToken: string };
}

const isRotatedMarker = (v: unknown): v is RotatedMarker =>
  typeof v === 'object' && v !== null && 'rotatedTo' in v;

@Injectable()
export class LocalAuthProvider implements IAuthProvider {
  private readonly accessTokenTtl: number;
  private readonly maxSessionTtl: number;
  private readonly refreshGraceTtl: number;

  constructor(
    @InjectLogger() private logger: PinoLogger,
    @Inject(IAM_REDIS) private readonly redis: Redis,
    private readonly jwtService: JwtService,
    @Inject(ORG_ACCESS)
    private readonly orgAccess: IOrgAccessProvider,
    private readonly configService: ConfigService,
  ) {
    this.accessTokenTtl = this.configService.get<number>('IAM_ACCESS_TOKEN_TTL', 900);
    // 30 days: the ABSOLUTE session lifetime — how long a user goes without
    // typing a password. Security is carried by the 15-minute access token,
    // revocation lists and logout-everywhere, not by forcing daily logins.
    this.maxSessionTtl = this.configService.get<number>('IAM_MAX_SESSION_TTL', 2_592_000);
    this.refreshGraceTtl = this.configService.get<number>('IAM_REFRESH_GRACE_TTL', 60);
  }

  async issueTokens(dto: IamIssueTokensRequest): Promise<IamIssueTokensResponse> {
    const refreshToken = randomBytes(32).toString('hex');
    const sessionStart = Date.now();
    const iat = Math.floor(Date.now() / 1000);

    const accessToken = await this.jwtService.signAsync(
      { sub: dto.userId, orgId: dto.orgId, orgRole: dto.orgRole, systemRole: dto.systemRole, iat },
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

    const parsed: SessionData | RotatedMarker = JSON.parse(data);

    // Revoking a token that sits in its rotation grace window must kill the
    // SUCCESSOR session — that is where the live session actually is.
    if (isRotatedMarker(parsed)) {
      await this.redis.del(key);
      return this.revokeToken({ token: parsed.rotatedTo.refreshToken });
    }

    const session: SessionData = parsed;

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

    const parsed: SessionData | RotatedMarker = JSON.parse(data);

    // Grace window: this token was already rotated moments ago. Hand back the
    // same successor pair instead of failing. This is what stops (a) N
    // concurrent requests from the same client racing one rotation — the
    // losers used to get 401s that logged the user out — and (b) a mobile
    // client that lost the rotation response mid-network from being stranded
    // with a dead token.
    if (isRotatedMarker(parsed)) {
      return parsed.rotatedTo;
    }

    const session: SessionData = parsed;
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

    // Re-read BOTH roles from the database. Skipping either would freeze it at
    // the value it held when the session began, so a demotion would keep
    // applying for the whole session rather than the access-token TTL.
    session.orgRole = access.orgRole;
    session.systemRole = access.systemRole;

    // Issue new tokens, preserving original session start
    const newRefreshToken = randomBytes(32).toString('hex');
    const newKey = this.refreshTokenKey(newRefreshToken);
    const remainingTtl = Math.floor((this.maxSessionTtl * 1000 - elapsed) / 1000);
    const iat = Math.floor(Date.now() / 1000);

    const accessToken = await this.jwtService.signAsync(
      {
        sub: session.userId,
        orgId: session.orgId,
        orgRole: session.orgRole,
        systemRole: session.systemRole,
        iat,
      },
      { expiresIn: this.accessTokenTtl },
    );

    // Rotate: the OLD key becomes a short-lived marker pointing at the pair
    // just issued (not deleted — see the grace check above), the new key
    // becomes the live session. After the grace window the marker expires and
    // the old token is dead for good.
    const userSessionsKey = this.userSessionsKey(session.userId);
    const marker: RotatedMarker = { rotatedTo: { accessToken, refreshToken: newRefreshToken } };
    await this.redis
      .multi()
      .set(key, JSON.stringify(marker), 'EX', this.refreshGraceTtl)
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
