import { Controller, Delete, Get, Req, Res } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  ActiveUser,
  IamService,
  InjectLogger,
  Permissions,
  PinoLogger,
  ZodRequest,
  extractAccessToken,
} from '@pkg/server';
import { tryCatch } from '@pkg/utils';
import {
  type AccountExport,
  type ActiveUser as ActiveUserType,
  type DeleteAccountRequest,
  DeleteAccountRequestSchema,
  DeleteAccountResponse,
  type ExportAccountRequest,
  ExportAccountRequestSchema,
} from '@pkg/contracts';
import { AccountService } from './account.service.js';

/**
 * The session's own account. Nothing in a request names an account, so no
 * one can delete or read out anyone else's through here.
 */
@Controller('account')
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
    private readonly iamService: IamService,
    @InjectLogger() private readonly logger: PinoLogger,
  ) {}

  @Delete()
  @Permissions('auth:delete-self')
  async remove(
    @ZodRequest(DeleteAccountRequestSchema) dto: DeleteAccountRequest,
    @ActiveUser() activeUser: ActiveUserType,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<DeleteAccountResponse> {
    await this.accountService.deleteOwnAccount(activeUser.userId, dto);

    // Refresh tokens are revoked by the service; the access token that made
    // this call must not outlive the account either.
    const accessToken = extractAccessToken(req);
    if (accessToken) {
      const { e } = await tryCatch(this.iamService.auth.blacklistAccessToken(accessToken));
      if (e) this.logger.warn({ err: e }, 'Failed to blacklist access token after account deletion');
    }
    reply.clearCookie('accessToken', { path: '/' });
    reply.clearCookie('refreshToken', { path: '/' });
    return {};
  }

  @Get('export')
  @Permissions('auth:export-self')
  async export(
    @ZodRequest(ExportAccountRequestSchema) _dto: ExportAccountRequest,
    @ActiveUser() activeUser: ActiveUserType,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AccountExport> {
    const date = new Date().toISOString().slice(0, 10);
    reply.header('Content-Disposition', `attachment; filename="account-data-${date}.json"`);
    reply.header('Cache-Control', 'no-store');
    return this.accountService.exportOwnData(activeUser.userId);
  }
}
