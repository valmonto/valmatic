import { Controller, Get, Post, Req, Res } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuthService } from './auth.service';
import { PublicRoute, ActiveUser, IamService, Roles, Role, COOKIE_OPTIONS, COOKIE_TTL } from '@pkg/server';
import { tryCatch } from '@pkg/utils';
import {
  ChangePasswordRequest,
  ChangePasswordRequestSchema,
  ChangePasswordResponse,
  CurrentUserRequest,
  CurrentUserRequestSchema,
  CurrentUserResponse,
  LoginRequest,
  LoginRequestSchema,
  LoginResponse,
  LogoutAllRequest,
  LogoutAllRequestSchema,
  LogoutAllResponse,
  LogoutRequest,
  LogoutRequestSchema,
  LogoutResponse,
  RegisterRequest,
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
    @InjectPinoLogger(AuthController.name) private readonly logger: PinoLogger,
  ) {}

  @PublicRoute()
  @Post('login')
  async login(
    @ZodRequest(LoginRequestSchema) dto: LoginRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<LoginResponse> {
    const { response, accessToken, refreshToken } = await this.authService.login(dto);

    reply.setCookie('accessToken', accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: COOKIE_TTL.ACCESS_TOKEN,
    });

    reply.setCookie('refreshToken', refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: COOKIE_TTL.REFRESH_TOKEN,
    });

    return response;
  }

  @PublicRoute()
  @Post('register')
  async register(
    @ZodRequest(RegisterRequestSchema) dto: RegisterRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<RegisterResponse> {
    const { response, accessToken, refreshToken } = await this.authService.register(dto);

    reply.setCookie('accessToken', accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: COOKIE_TTL.ACCESS_TOKEN,
    });

    reply.setCookie('refreshToken', refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: COOKIE_TTL.REFRESH_TOKEN,
    });

    return response;
  }

  @Post('logout')
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  async logout(
    @ZodRequest(LogoutRequestSchema) dto: LogoutRequest,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<LogoutResponse> {
    // Blacklist the access token so it can't be reused
    const signedAccessToken = req.cookies?.accessToken;
    if (signedAccessToken) {
      const unsigned = req.unsignCookie(signedAccessToken);
      if (unsigned.valid && unsigned.value) {
        const { e } = await tryCatch(this.iamService.auth.blacklistAccessToken(unsigned.value));
        if (e) {
          this.logger.warn({ err: e }, 'Failed to blacklist access token during logout');
        }
      }
    }

    // Revoke the refresh token
    const signedRefreshToken = req.cookies?.refreshToken;
    if (signedRefreshToken) {
      const unsigned = req.unsignCookie(signedRefreshToken);
      if (unsigned.valid && unsigned.value) {
        const { e } = await tryCatch(this.iamService.auth.revokeToken({ token: unsigned.value }));
        if (e) {
          this.logger.warn({ err: e }, 'Failed to revoke refresh token during logout');
        }
      }
    }

    reply.clearCookie('accessToken', { path: '/' });
    reply.clearCookie('refreshToken', { path: '/' });

    return {};
  }

  @Get('me')
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  async me(
    @ZodRequest(CurrentUserRequestSchema) dto: CurrentUserRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<CurrentUserResponse> {
    return this.authService.getMe(activeUser);
  }

  @Post('logout-all')
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  async logoutAll(
    @ZodRequest(LogoutAllRequestSchema) dto: LogoutAllRequest,
    @ActiveUser() activeUser: ActiveUserType,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<LogoutAllResponse> {
    await this.authService.logoutAllDevices(activeUser.userId);

    // Blacklist current access token and clear cookies
    const signedAccessToken = req.cookies?.accessToken;
    if (signedAccessToken) {
      const unsigned = req.unsignCookie(signedAccessToken);
      if (unsigned.valid && unsigned.value) {
        const { e } = await tryCatch(this.iamService.auth.blacklistAccessToken(unsigned.value));
        if (e) {
          this.logger.warn({ err: e }, 'Failed to blacklist access token during logout-all');
        }
      }
    }

    reply.clearCookie('accessToken', { path: '/' });
    reply.clearCookie('refreshToken', { path: '/' });
    return {};
  }

  @Post('change-password')
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  async changePassword(
    @ZodRequest(ChangePasswordRequestSchema) dto: ChangePasswordRequest,
    @ActiveUser() activeUser: ActiveUserType,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<ChangePasswordResponse> {
    await this.authService.changePassword(activeUser.userId, dto);

    // Clear current session (user logged out from all devices)
    const signedAccessToken = req.cookies?.accessToken;
    if (signedAccessToken) {
      const unsigned = req.unsignCookie(signedAccessToken);
      if (unsigned.valid && unsigned.value) {
        const { e } = await tryCatch(this.iamService.auth.blacklistAccessToken(unsigned.value));
        if (e) {
          this.logger.warn({ err: e }, 'Failed to blacklist access token during password change');
        }
      }
    }

    reply.clearCookie('accessToken', { path: '/' });
    reply.clearCookie('refreshToken', { path: '/' });
    return {};
  }
}
