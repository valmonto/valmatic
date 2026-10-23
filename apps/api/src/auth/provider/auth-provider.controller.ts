import { Controller, Post, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { COOKIE_OPTIONS, COOKIE_TTL, PublicRoute, ZodRequest } from '@pkg/server';
import {
  ProviderSignInRequestSchema,
  type ProviderNonceResponse,
  type ProviderSignInRequest,
  type ProviderSignInResponse,
} from '@pkg/contracts';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AUTH_THROTTLE } from '../../config/index.js';
import { AuthProviderService } from './auth-provider.service.js';

/**
 * Sign in with Apple or Google. Public — they are how a caller becomes
 * signed in — and behind the same per-address limit as the password login.
 * Which providers are on is part of `GET /auth/options`.
 */
@Controller('auth/provider')
export class AuthProviderController {
  constructor(private readonly providers: AuthProviderService) {}

  /** A one-time value the app gives the provider; it comes back in the token. */
  @PublicRoute()
  @Post('nonce')
  @Throttle(AUTH_THROTTLE)
  nonce(): Promise<ProviderNonceResponse> {
    return this.providers.nonce();
  }

  @PublicRoute()
  @Post()
  @Throttle(AUTH_THROTTLE)
  async signIn(
    @ZodRequest(ProviderSignInRequestSchema) dto: ProviderSignInRequest,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<ProviderSignInResponse> {
    const { response, accessToken, refreshToken } = await this.providers.signIn(dto);

    // As in AuthController: the mobile app (`X-Client: mobile`) takes its
    // tokens in the body, a browser gets httpOnly cookies.
    if (req.headers['x-client'] === 'mobile') {
      return { ...response, tokens: { accessToken, refreshToken } };
    }
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
}
