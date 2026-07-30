import { Injectable } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpScope } from '@pkg/contracts';
import { InjectLogger, PinoLogger } from '@pkg/server';
import { McpTools } from './mcp-tools';

const text = (data: unknown): { content: { type: 'text'; text: string }[] } => ({
  content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
});

/**
 * Builds a per-request MCP server exposing ONLY the tools the key's scopes
 * cover. The filtering happens at REGISTRATION, not at call time — an
 * out-of-scope tool does not exist for that key, rather than existing and
 * refusing.
 */
@Injectable()
export class McpServerFactory {
  constructor(
    private readonly tools: McpTools,
    @InjectLogger() private readonly logger: PinoLogger,
  ) {}

  build(auth: { keyId: string; name: string; scopes: McpScope[] }): McpServer {
    const server = new McpServer({ name: 'valmatic', version: '1.0.0' });

    // Always present: lets an agent discover what this key was granted.
    server.registerTool(
      'whoami',
      { description: 'This API key: its name and the scopes it was granted.' },
      async () => text({ name: auth.name, scopes: auth.scopes }),
    );

    for (const tool of this.tools.catalog()) {
      if (tool.scope !== null && !auth.scopes.includes(tool.scope)) continue;

      server.registerTool(
        tool.name,
        { description: tool.description, inputSchema: tool.inputSchema },
        async (args: Record<string, unknown>) => {
          this.logger.info({ tool: tool.name, keyId: auth.keyId }, 'MCP tool call');
          return text(await tool.handler(args ?? {}));
        },
      );
    }

    return server;
  }
}
