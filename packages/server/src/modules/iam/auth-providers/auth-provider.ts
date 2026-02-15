import type {
  IamIssueTokensRequest,
  IamIssueTokensResponse,
  IamVerifyTokenRequest,
  IamVerifyTokenResponse,
  IamRevokeTokenRequest,
  IamRevokeTokenResponse,
  IamRefreshTokenRequest,
  IamRefreshTokenResponse,
} from '@pkg/contracts';

export const AUTH_PROVIDER = Symbol('AUTH_PROVIDER');

export interface IAuthProvider {
  issueTokens(dto: IamIssueTokensRequest): Promise<IamIssueTokensResponse>;
  verifyToken(dto: IamVerifyTokenRequest): Promise<IamVerifyTokenResponse>;
  revokeToken(dto: IamRevokeTokenRequest): Promise<IamRevokeTokenResponse>;
  refresh(dto: IamRefreshTokenRequest): Promise<IamRefreshTokenResponse>;
  blacklistAccessToken(token: string): Promise<void>;
  isAccessTokenBlacklisted(token: string): Promise<boolean>;
  revokeAllForUser(userId: string): Promise<void>;
  isTokenIssuedBeforeLogoutAll(userId: string, issuedAt: number): Promise<boolean>;
}
