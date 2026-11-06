import { Controller, Delete, Get, Header, Req, Res } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import {
  ActiveUser,
  IamService,
  InjectLogger,
  Permissions,
  PinoLogger,
  ZodRequest,
  AuthCookies,
  type HttpRequest,
  type HttpResponse,
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
    private readonly cookies: AuthCookies,
    private readonly adapterHost: HttpAdapterHost,
    @InjectLogger() private readonly logger: PinoLogger,
  ) {}

  @Delete()
  @Permissions('auth:delete-self')
  async remove(
    @ZodRequest(DeleteAccountRequestSchema) dto: DeleteAccountRequest,
    @ActiveUser() activeUser: ActiveUserType,
    @Req() req: HttpRequest,
    @Res({ passthrough: true }) reply: HttpResponse,
  ): Promise<DeleteAccountResponse> {
    await this.accountService.deleteOwnAccount(activeUser.userId, dto);

    // Refresh tokens are revoked by the service; the access token that made
    // this call must not outlive the account either.
    const accessToken = this.cookies.accessToken(req);
    if (accessToken) {
      const { e } = await tryCatch(this.iamService.auth.blacklistAccessToken(accessToken));
      if (e)
        this.logger.warn({ err: e }, 'Failed to blacklist access token after account deletion');
    }
    this.cookies.clear(reply);
    return {};
  }

  @Get('export')
  @Header('Cache-Control', 'no-store')
  @Permissions('auth:export-self')
  async export(
    @ZodRequest(ExportAccountRequestSchema) _dto: ExportAccountRequest,
    @ActiveUser() activeUser: ActiveUserType,
    @Res({ passthrough: true }) reply: HttpResponse,
  ): Promise<AccountExport> {
    const date = new Date().toISOString().slice(0, 10);
    this.adapterHost.httpAdapter.setHeader(
      reply,
      'Content-Disposition',
      `attachment; filename="account-data-${date}.json"`,
    );
    return this.accountService.exportOwnData(activeUser.userId);
  }
}
