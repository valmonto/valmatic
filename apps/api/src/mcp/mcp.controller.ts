import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { PublicRoute } from '@pkg/server';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { NodeRequest, NodeResponse } from '@nestjs/platform-node';
import { McpServerFactory } from './mcp-server.factory.js';
import { McpAuthGuard, type McpAuth } from './mcp-auth.guard.js';

/**
 * MCP Streamable-HTTP endpoint. Stateless: each request builds a fresh server
 * scoped to the presenting key and a fresh transport. @PublicRoute() bypasses
 * the session chain; McpAuthGuard (Bearer API key) is the actual gate. The
 * Node adapter's request and response are Node's own (extended), so they go
 * to the SDK transport as they are; `@Res()` without passthrough tells Nest
 * the transport answers.
 */
@Controller('mcp')
export class McpController {
  constructor(private readonly factory: McpServerFactory) {}

  @Post()
  @PublicRoute()
  @UseGuards(McpAuthGuard)
  async handle(
    @Req() req: NodeRequest & { mcpAuth?: McpAuth },
    @Res() res: NodeResponse,
    @Body() body: unknown,
  ): Promise<void> {
    const server = this.factory.build(req.mcpAuth!);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

    res.on('close', () => {
      void transport.close();
      void server.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, body);
  }
}
