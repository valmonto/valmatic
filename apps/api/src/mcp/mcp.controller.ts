import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { PublicRoute } from '@pkg/server';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { McpServerFactory } from './mcp-server.factory.js';
import { McpAuthGuard, type McpAuth } from './mcp-auth.guard.js';

/**
 * MCP Streamable-HTTP endpoint. Stateless: each request builds a fresh server
 * scoped to the presenting key and a fresh transport. @PublicRoute() bypasses
 * the session chain; McpAuthGuard (Bearer API key) is the actual gate. The
 * Fastify reply is hijacked so the SDK transport can own the raw response.
 */
@Controller('mcp')
export class McpController {
  constructor(private readonly factory: McpServerFactory) {}

  @Post()
  @PublicRoute()
  @UseGuards(McpAuthGuard)
  async handle(
    @Req() req: FastifyRequest & { mcpAuth?: McpAuth },
    @Res() reply: FastifyReply,
    @Body() body: unknown,
  ): Promise<void> {
    const server = this.factory.build(req.mcpAuth!);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

    reply.hijack();
    reply.raw.on('close', () => {
      void transport.close();
      void server.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req.raw as IncomingMessage, reply.raw as ServerResponse, body);
  }
}
