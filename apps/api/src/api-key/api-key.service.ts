import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { InjectLogger, PinoLogger } from '@pkg/server';
import { k } from '@pkg/locales';
import type {
  ApiKey,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  ListApiKeysResponse,
  McpScope,
} from '@pkg/contracts';
import type { ApiKeyRow } from '@pkg/database';
import { ApiKeyRepository } from './api-key.repository';

const hash = (key: string): string => createHash('sha256').update(key).digest('hex');

const toView = (row: ApiKeyRow): ApiKey => ({
  id: row.id,
  name: row.name,
  prefix: row.prefix,
  scopes: row.scopes as McpScope[],
  lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
  createdAt: row.createdAt.toISOString(),
});

@Injectable()
export class ApiKeyService {
  constructor(
    private readonly repository: ApiKeyRepository,
    @InjectLogger() private readonly logger: PinoLogger,
  ) {}

  /**
   * Mint a key. The scopes chosen here ARE the exposure decision — the MCP
   * server will only ever show this key the tools those scopes cover. The
   * plaintext is returned once and never stored; only its hash is kept.
   */
  async create(createdBy: string, dto: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
    const key = `sk_${randomBytes(24).toString('base64url')}`;

    const row = await this.repository.insert({
      name: dto.name,
      prefix: key.slice(0, 10),
      hashedKey: hash(key),
      scopes: [...new Set(dto.scopes)],
      userId: createdBy,
    });

    this.logger.info({ keyId: row.id, scopes: row.scopes, createdBy }, 'API key created');

    return { ...toView(row), key };
  }

  async list(): Promise<ListApiKeysResponse> {
    const rows = await this.repository.listActive();
    return { data: rows.map(toView) };
  }

  async revoke(id: string): Promise<void> {
    const revoked = await this.repository.revoke(id);
    if (!revoked) {
      throw new NotFoundException(k.mcp.errors.keyNotFound);
    }
    this.logger.info({ keyId: id }, 'API key revoked');
  }

  /** Presented token → its scopes, or null. Used by the MCP auth guard. */
  async verify(token: string): Promise<{ keyId: string; name: string; scopes: McpScope[] } | null> {
    const row = await this.repository.findActiveByHash(hash(token));
    if (!row) return null;

    // Fire-and-forget: a failed timestamp must never fail an auth check. But
    // the rejection is logged rather than swallowed — a silent no-op is exactly
    // what let the stamp never run and go unnoticed.
    this.repository.touchLastUsed(row.id).catch((err: unknown) => {
      this.logger.warn({ err, keyId: row.id }, 'failed to stamp API key last_used_at');
    });
    return { keyId: row.id, name: row.name, scopes: row.scopes as McpScope[] };
  }
}
