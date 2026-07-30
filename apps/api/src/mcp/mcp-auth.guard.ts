import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FastifyRequest } from 'fastify';
import { k } from '@pkg/locales';
import type { McpScope } from '@pkg/contracts';
import { ApiKeyService } from '../api-key/api-key.service';

export interface McpAuth {
  keyId: string;
  name: string;
  scopes: McpScope[];
}

/**
 * Bearer API-key auth for /mcp — machine keys, not user sessions, so the
 * normal cookie/JWT chain does not apply (the route is @PublicRoute and this
 * guard is the actual gate).
 *
 * MCP_ENABLED unset → 404, not 401: a disabled surface should not confirm its
 * own existence.
 */
@Injectable()
export class McpAuthGuard implements CanActivate {
  constructor(
    private readonly apiKeys: ApiKeyService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    if (!this.configService.get<boolean>('MCP_ENABLED')) {
      throw new NotFoundException();
    }

    const req = ctx.switchToHttp().getRequest<FastifyRequest & { mcpAuth?: McpAuth }>();
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : undefined;
    if (!token) throw new UnauthorizedException(k.mcp.errors.missingKey);

    const auth = await this.apiKeys.verify(token);
    if (!auth) throw new UnauthorizedException(k.mcp.errors.invalidKey);

    req.mcpAuth = auth;
    return true;
  }
}
