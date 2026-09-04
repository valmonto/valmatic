import { Injectable } from '@nestjs/common';
import { z, type ZodRawShape } from 'zod';
import type { McpScope } from '@pkg/contracts';
import { OrgService } from '../org/org.service';

export interface McpToolDef {
  name: string;
  /** null = visible to every authenticated key (e.g. whoami). */
  scope: McpScope | null;
  description: string;
  inputSchema?: ZodRawShape;
  handler: (args: Record<string, unknown>) => Promise<unknown>;
}

const MAX_LIMIT = 100;

/**
 * The tool catalog — one place, each tool tagged with the scope that exposes
 * it. A key sees exactly the tools its granted scopes cover; granting a scope
 * at key creation IS the exposure decision.
 *
 * The convention every future tool follows: wrap a SERVICE method, never raw
 * SQL — tools get the same rules, logging and shape the HTTP surface has.
 */
@Injectable()
export class McpTools {
  constructor(private readonly orgService: OrgService) {}

  catalog(): McpToolDef[] {
    return [
      {
        name: 'list_organizations',
        scope: 'orgs:read',
        description: 'Every organization on the platform, with member counts.',
        inputSchema: {
          skip: z.number().int().min(0).optional(),
          limit: z.number().int().min(1).max(MAX_LIMIT).optional(),
        },
        handler: async (args) =>
          this.orgService.adminListOrgs({
            skip: (args.skip as number | undefined) ?? 0,
            limit: (args.limit as number | undefined) ?? 20,
          }),
      },
      {
        name: 'platform_stats',
        scope: 'platform:read',
        description: 'Platform totals (organization count).',
        handler: async () => {
          const { meta } = await this.orgService.adminListOrgs({ skip: 0, limit: 1 });
          return { organizations: meta.total };
        },
      },
    ];
  }
}
