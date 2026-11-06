import { Throttle } from '@nestjs/throttler';
import { AUTH_THROTTLE } from '../config/index.js';
import {
  Controller,
  Get,
  Inject,
  Optional,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { MULTI_ORG } from '../org/multi-org.js';
import { InjectLogger, PinoLogger } from '@pkg/server';
import { AuthService } from './auth.service.js';
import { MailService } from '../mail/mail.service.js';
import { EmailVerificationService } from './email-verification/email-verification.service.js';
import { AuthProviderService } from './provider/auth-provider.service.js';
import { ConfigService } from '@nestjs/config';
import {
  PublicRoute,
  ActiveUser,
  IamService,
  Permissions,
  AuthCookies,
  type HttpRequest,
  type HttpResponse,
} from '@pkg/server';
import { k } from '@pkg/locales';
import { tryCatch } from '@pkg/utils';
import type { AuthOptionsResponse } from '@pkg/contracts';
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
import { ZodRequest } from '@pkg/server';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly iamService: IamService,
    private readonly mail: MailService,
    private readonly verifications: EmailVerificationService,
    private readonly providers: AuthProviderService,
    private readonly configService: ConfigService,
    private readonly cookies: AuthCookies,
    @InjectLogger() private readonly logger: PinoLogger,
    @Optional() @Inject(MULTI_ORG) private readonly multiOrg?: boolean,
  ) {}

  /**
   * What this deployment can do, for the sign-in screens: a client offers
   * "forgot password?" only when an email can actually be sent, and a
   * provider button only when that provider can be verified.
   */
  @PublicRoute()
  @Get('options')
  options(): AuthOptionsResponse {
    return {
      passwordResetEnabled: this.mail.isConfigured,
      registrationEnabled: this.configService.get<boolean>('AUTH_REGISTRATION_ENABLED') === true,
      providers: this.providers.available(),
      organizations: this.multiOrg ? 'many' : 'one',
    };
  }

  /**
   * Non-browser clients (the mobile app) send `X-Client: mobile` and receive
   * their tokens in the response body instead of as httpOnly cookies, since
   * React Native has no browser cookie jar. Web clients are unaffected.
   */
  private isMobileClient(req: HttpRequest): boolean {
    return req.headers['x-client'] === 'mobile';
  }

  /**
   * Delivers freshly issued tokens to the client: mobile gets them in the
   * body, web gets httpOnly cookies. Mutates `response` for mobile and
   * returns it so callers can `return this.deliverTokens(...)`.
   */
  private deliverTokens<T extends { tokens?: AuthTokens }>(
    req: HttpRequest,
    reply: HttpResponse,
    tokens: AuthTokens,
    response: T,
  ): T {
    if (this.isMobileClient(req)) {
      return { ...response, tokens };
    }
    this.cookies.set(reply, tokens);
    return response;
  }

  @PublicRoute()
  // Strict spray limit, declared where the route lives. Unauthenticated, so
  // the throttler keys these buckets by IP alone — nothing client-controlled.
  @Post('login')
  @Throttle(AUTH_THROTTLE)
  async login(
    @ZodRequest(LoginRequestSchema) dto: LoginRequest,
    @Req() req: HttpRequest,
    @Res({ passthrough: true }) reply: HttpResponse,
  ): Promise<LoginResponse> {
    // An address is missing only when the socket already closed; those share
    // one lockout bucket rather than escaping the limit.
    const { response, accessToken, refreshToken } = await this.authService.login(
      dto,
      req.ip ?? 'unknown',
    );
    return this.deliverTokens(req, reply, { accessToken, refreshToken }, response);
  }

  @PublicRoute()
  @Post('register')
  @Throttle(AUTH_THROTTLE)
  async register(
    @ZodRequest(RegisterRequestSchema) dto: RegisterRequest,
    @Req() req: HttpRequest,
    @Res({ passthrough: true }) reply: HttpResponse,
  ): Promise<RegisterResponse> {
    const { response, accessToken, refreshToken } = await this.authService.register(dto);
    // The address is mailed a link to confirm it. Not awaited: the account
    // works at once, and a slow mail service must not slow the sign-up.
    void this.verifications.send(response.user.id, dto.locale).catch((error: unknown) => {
      this.logger.error({ err: error }, 'Verification email failed');
    });
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
    @Req() req: HttpRequest,
    @Res({ passthrough: true }) reply: HttpResponse,
  ): Promise<RefreshResponse> {
    const currentRefreshToken = dto.refreshToken ?? this.cookies.refreshToken(req);
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
    @Req() req: HttpRequest,
    @Res({ passthrough: true }) reply: HttpResponse,
  ): Promise<LogoutResponse> {
    // Blacklist the access token so it can't be reused (cookie or Bearer)
    const accessToken = this.cookies.accessToken(req);
    if (accessToken) {
      const { e } = await tryCatch(this.iamService.auth.blacklistAccessToken(accessToken));
      if (e) {
        this.logger.warn({ err: e }, 'Failed to blacklist access token during logout');
      }
    }

    // Revoke the refresh token (cookie for web, request body for mobile)
    const refreshToken = this.cookies.refreshToken(req) ?? dto.refreshToken;
    if (refreshToken) {
      const { e } = await tryCatch(this.iamService.auth.revokeToken({ token: refreshToken }));
      if (e) {
        this.logger.warn({ err: e }, 'Failed to revoke refresh token during logout');
      }
    }

    this.cookies.clear(reply);
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
    @Req() req: HttpRequest,
    @Res({ passthrough: true }) reply: HttpResponse,
  ): Promise<LogoutAllResponse> {
    await this.authService.logoutAllDevices(activeUser.userId);

    // Blacklist current access token and clear cookies
    const accessToken = this.cookies.accessToken(req);
    if (accessToken) {
      const { e } = await tryCatch(this.iamService.auth.blacklistAccessToken(accessToken));
      if (e) {
        this.logger.warn({ err: e }, 'Failed to blacklist access token during logout-all');
      }
    }

    this.cookies.clear(reply);
    return {};
  }

  @Post('change-password')
  @Permissions('auth:change-password')
  async changePassword(
    @ZodRequest(ChangePasswordRequestSchema) dto: ChangePasswordRequest,
    @ActiveUser() activeUser: ActiveUserType,
    @Req() req: HttpRequest,
    @Res({ passthrough: true }) reply: HttpResponse,
  ): Promise<ChangePasswordResponse> {
    await this.authService.changePassword(activeUser.userId, dto);

    // Clear current session (user logged out from all devices)
    const accessToken = this.cookies.accessToken(req);
    if (accessToken) {
      const { e } = await tryCatch(this.iamService.auth.blacklistAccessToken(accessToken));
      if (e) {
        this.logger.warn({ err: e }, 'Failed to blacklist access token during password change');
      }
    }

    this.cookies.clear(reply);
    return {};
  }
}
