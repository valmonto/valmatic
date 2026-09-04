import { Throttle } from '@nestjs/throttler';
import { AUTH_THROTTLE } from '../config';
import { Controller, Get, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { InjectLogger, PinoLogger } from '@pkg/server';
import { AuthService } from './auth.service';
import {
  PublicRoute,
  ActiveUser,
  IamService,
  Permissions,
  COOKIE_OPTIONS,
  COOKIE_TTL,
  extractAccessToken,
  extractRefreshToken,
} from '@pkg/server';
import { k } from '@pkg/locales';
import { tryCatch } from '@pkg/utils';
import {
  type AuthTokens,
  type ChangePasswordRequest,
  ChangePasswordRequestSchema,
  ChangePasswordResponse,
  type CurrentUserRequest,
  CurrentUserRequestSchema,
  CurrentUserResponse,
  type LoginRequest,
  LoginRequestSchema,
  LoginResponse,
  type LogoutAllRequest,
  LogoutAllRequestSchema,
  LogoutAllResponse,
  type LogoutRequest,
  LogoutRequestSchema,
  LogoutResponse,
  type RefreshRequest,
  RefreshRequestSchema,
  RefreshResponse,
  type RegisterRequest,
  RegisterRequestSchema,
  RegisterResponse,
  type ActiveUser as ActiveUserType,
} from '@pkg/contracts';
import type { FastifyReply, FastifyRequest } from 'fastify';
import '@fastify/cookie';
import { ZodRequest } from '@pkg/server';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly iamService: IamService,
    @InjectLogger() private readonly logger: PinoLogger,
  ) {}

  /**
   * Non-browser clients (the mobile app) send `X-Client: mobile` and receive
   * their tokens in the response body instead of as httpOnly cookies, since
   * React Native has no browser cookie jar. Web clients are unaffected.
   */
  private isMobileClient(req: FastifyRequest): boolean {
    return req.headers['x-client'] === 'mobile';
  }

  private setAuthCookies(reply: FastifyReply, tokens: AuthTokens): void {
    reply.setCookie('accessToken', tokens.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: COOKIE_TTL.ACCESS_TOKEN,
    });
    reply.setCookie('refreshToken', tokens.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: COOKIE_TTL.REFRESH_TOKEN,
    });
  }

  private clearAuthCookies(reply: FastifyReply): void {
    reply.clearCookie('accessToken', { path: '/' });
    reply.clearCookie('refreshToken', { path: '/' });
  }

  /**
   * Delivers freshly issued tokens to the client: mobile gets them in the
   * body, web gets httpOnly cookies. Mutates `response` for mobile and
   * returns it so callers can `return this.deliverTokens(...)`.
   */
  private deliverTokens<T extends { tokens?: AuthTokens }>(
    req: FastifyRequest,
    reply: FastifyReply,
    tokens: AuthTokens,
    response: T,
  ): T {
    if (this.isMobileClient(req)) {
      return { ...response, tokens };
    }
    this.setAuthCookies(reply, tokens);
    return response;
  }

  @PublicRoute()
  // Strict spray limit, declared where the route lives. Unauthenticated, so
  // the throttler keys these buckets by IP alone — nothing client-controlled.
  @Post('login')
  @Throttle(AUTH_THROTTLE)
  async login(
    @ZodRequest(LoginRequestSchema) dto: LoginRequest,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<LoginResponse> {
    const { response, accessToken, refreshToken } = await this.authService.login(dto);
    return this.deliverTokens(req, reply, { accessToken, refreshToken }, response);
  }

  @PublicRoute()
  @Post('register')
  @Throttle(AUTH_THROTTLE)
  async register(
    @ZodRequest(RegisterRequestSchema) dto: RegisterRequest,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<RegisterResponse> {
    const { response, accessToken, refreshToken } = await this.authService.register(dto);
    return this.deliverTokens(req, reply, { accessToken, refreshToken }, response);
  }

  /**
   * Explicit refresh for mobile clients, which cannot use the transparent
   * cookie-based refresh performed by the auth guard. Accepts the refresh
   * token from the body (mobile) or the refresh cookie (web fallback).
   */
  @PublicRoute()
  @Post('refresh')
  async refresh(
    @ZodRequest(RefreshRequestSchema) dto: RefreshRequest,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<RefreshResponse> {
    const currentRefreshToken = dto.refreshToken ?? extractRefreshToken(req);
    if (!currentRefreshToken) {
      throw new UnauthorizedException(k.auth.errors.invalidRefreshToken);
    }

    const tokens = await this.authService.refreshTokens(currentRefreshToken);
    return this.deliverTokens(req, reply, tokens, {} as RefreshResponse);
  }

  @Post('logout')
  @Permissions('auth:logout')
  async logout(
    @ZodRequest(LogoutRequestSchema) dto: LogoutRequest,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<LogoutResponse> {
    // Blacklist the access token so it can't be reused (cookie or Bearer)
    const accessToken = extractAccessToken(req);
    if (accessToken) {
      const { e } = await tryCatch(this.iamService.auth.blacklistAccessToken(accessToken));
      if (e) {
        this.logger.warn({ err: e }, 'Failed to blacklist access token during logout');
      }
    }

    // Revoke the refresh token (cookie for web, request body for mobile)
    const refreshToken = extractRefreshToken(req) ?? dto.refreshToken;
    if (refreshToken) {
      const { e } = await tryCatch(this.iamService.auth.revokeToken({ token: refreshToken }));
      if (e) {
        this.logger.warn({ err: e }, 'Failed to revoke refresh token during logout');
      }
    }

    this.clearAuthCookies(reply);
    return {};
  }

  @Get('me')
  @Permissions('auth:read-self')
  async me(
    @ZodRequest(CurrentUserRequestSchema) dto: CurrentUserRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<CurrentUserResponse> {
    return this.authService.getMe(activeUser);
  }

  @Post('logout-all')
  @Permissions('auth:logout')
  async logoutAll(
    @ZodRequest(LogoutAllRequestSchema) dto: LogoutAllRequest,
    @ActiveUser() activeUser: ActiveUserType,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<LogoutAllResponse> {
    await this.authService.logoutAllDevices(activeUser.userId);

    // Blacklist current access token and clear cookies
    const accessToken = extractAccessToken(req);
    if (accessToken) {
      const { e } = await tryCatch(this.iamService.auth.blacklistAccessToken(accessToken));
      if (e) {
        this.logger.warn({ err: e }, 'Failed to blacklist access token during logout-all');
      }
    }

    this.clearAuthCookies(reply);
    return {};
  }

  @Post('change-password')
  @Permissions('auth:change-password')
  async changePassword(
    @ZodRequest(ChangePasswordRequestSchema) dto: ChangePasswordRequest,
    @ActiveUser() activeUser: ActiveUserType,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<ChangePasswordResponse> {
    await this.authService.changePassword(activeUser.userId, dto);

    // Clear current session (user logged out from all devices)
    const accessToken = extractAccessToken(req);
    if (accessToken) {
      const { e } = await tryCatch(this.iamService.auth.blacklistAccessToken(accessToken));
      if (e) {
        this.logger.warn({ err: e }, 'Failed to blacklist access token during password change');
      }
    }

    this.clearAuthCookies(reply);
    return {};
  }
}
