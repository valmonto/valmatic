import z from 'zod';

export const ActiveUserSchema = z.object({
  orgId: z.string(),
  userId: z.string(),
  role: z.string(),
});

export type ActiveUser = z.infer<typeof ActiveUserSchema>;

export const IamIssueTokensRequestSchema = ActiveUserSchema;

export const IamIssueTokensResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const IamVerifyTokenRequestSchema = z.object({
  token: z.string(),
});

export const IamVerifyTokenResponseSchema = z.object({
  userId: z.string(),
});

export const IamRevokeTokenRequestSchema = z.object({
  token: z.string(),
});

export const IamRevokeTokenResponseSchema = z.object({
  userId: z.string(),
});

export const IamRefreshTokenRequestSchema = z.object({
  refreshToken: z.string(),
});

export const IamRefreshTokenResponseSchema = IamIssueTokensResponseSchema;

export type IamIssueTokensRequest = z.infer<typeof IamIssueTokensRequestSchema>;
export type IamIssueTokensResponse = z.infer<typeof IamIssueTokensResponseSchema>;

export type IamVerifyTokenRequest = z.infer<typeof IamVerifyTokenRequestSchema>;
export type IamVerifyTokenResponse = z.infer<typeof IamVerifyTokenResponseSchema>;

export type IamRevokeTokenRequest = z.infer<typeof IamRevokeTokenRequestSchema>;
export type IamRevokeTokenResponse = z.infer<typeof IamRevokeTokenResponseSchema>;

export type IamRefreshTokenRequest = z.infer<typeof IamRefreshTokenRequestSchema>;
export type IamRefreshTokenResponse = z.infer<typeof IamRefreshTokenResponseSchema>;
