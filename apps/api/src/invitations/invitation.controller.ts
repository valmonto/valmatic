import { Throttle } from '@nestjs/throttler';
import { Controller, Delete, Get, Post, Req, Res } from '@nestjs/common';
import {
  ActiveUser,
  COOKIE_OPTIONS,
  COOKIE_TTL,
  Permissions,
  PublicRoute,
  ZodRequest,
} from '@pkg/server';
import {
  type AcceptInvitationAsMemberRequest,
  AcceptInvitationAsMemberRequestSchema,
  AcceptInvitationAsMemberResponse,
  type AcceptInvitationRequest,
  AcceptInvitationRequestSchema,
  AcceptInvitationResponse,
  type ActiveUser as ActiveUserType,
  type AuthTokens,
  type CreateInvitationRequest,
  CreateInvitationRequestSchema,
  CreateInvitationResponse,
  type ListInvitationsRequest,
  ListInvitationsRequestSchema,
  ListInvitationsResponse,
  type PreviewInvitationRequest,
  PreviewInvitationRequestSchema,
  PreviewInvitationResponse,
  type RevokeInvitationRequest,
  RevokeInvitationRequestSchema,
  RevokeInvitationResponse,
} from '@pkg/contracts';
import type { FastifyReply, FastifyRequest } from 'fastify';
import '@fastify/cookie';
import { InvitationService } from './invitation.service';

/**
 * Org invitations: invite-by-link (out-of-band delivery — no email transport,
 * see GAPS.md) plus accept. The mutating org routes carry `@Permissions('org:invite')`
 * (owner/admin). Preview and new-user accept are public — the token itself is
 * the credential — and rate-limited like the other unauthenticated routes.
 */
@Controller('invitations')
export class InvitationController {
  constructor(private readonly invitations: InvitationService) {}

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

  @Post()
  @Permissions('org:invite')
  async create(
    @ZodRequest(CreateInvitationRequestSchema) dto: CreateInvitationRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<CreateInvitationResponse> {
    return this.invitations.create(activeUser, dto);
  }

  @Get()
  @Permissions('org:invite')
  async list(
    @ZodRequest(ListInvitationsRequestSchema) dto: ListInvitationsRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<ListInvitationsResponse> {
    return this.invitations.list(activeUser);
  }

  @Delete(':id')
  @Permissions('org:invite')
  async revoke(
    @ZodRequest(RevokeInvitationRequestSchema) dto: RevokeInvitationRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<RevokeInvitationResponse> {
    await this.invitations.revoke(activeUser, dto.id);
    return {};
  }

  @PublicRoute()
  @Post('preview')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async preview(
    @ZodRequest(PreviewInvitationRequestSchema) dto: PreviewInvitationRequest,
  ): Promise<PreviewInvitationResponse> {
    return this.invitations.preview(dto.token);
  }

  /**
   * New invitee with no account: set a password and get an account + membership
   * in one step, then auto-login (tokens delivered as for register/login). The
   * email is taken from the invitation, not this payload.
   */
  @PublicRoute()
  @Post('accept')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async accept(
    @ZodRequest(AcceptInvitationRequestSchema) dto: AcceptInvitationRequest,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AcceptInvitationResponse> {
    const { response, tokens } = await this.invitations.acceptAsNewUser(dto);
    // Mobile gets tokens in the body; web gets httpOnly cookies (as in AuthController).
    if (this.isMobileClient(req)) {
      return { ...response, tokens };
    }
    this.setAuthCookies(reply, tokens);
    return response;
  }

  /**
   * Existing, logged-in account joining the org the invite names. Any
   * authenticated user may reach this (they are not yet a member of the target
   * org, so no org-scoped permission applies); the server verifies the session
   * email equals the invited email.
   */
  @Post('accept-existing')
  @Permissions('auth:read-self')
  async acceptExisting(
    @ZodRequest(AcceptInvitationAsMemberRequestSchema) dto: AcceptInvitationAsMemberRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<AcceptInvitationAsMemberResponse> {
    return this.invitations.acceptAsMember(activeUser, dto);
  }
}
