import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { FakeLogger } from '@pkg/testing';
import type { PinoLogger } from 'nestjs-pino';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { McpServerFactory } from '@/mcp/mcp-server.factory.js';
import type { McpTools } from '@/mcp/mcp-tools.js';

/**
 * The SDK turns each tool's zod shape into JSON Schema for `tools/list` and
 * validates `tools/call` arguments against it. That conversion is exactly
 * where the zod major matters (the SDK once required v3, and the api carried a
 * `zod-v3` alias for it), so this drives a real client over an in-memory
 * transport rather than trusting the type-level fit.
 */
describe('MCP tool schemas over the wire', () => {
  const handler = vi.fn(async (args: Record<string, unknown>) => ({ echoed: args }));
  const catalog = [
    {
      name: 'list_things',
      scope: 'orgs:read' as const,
      description: 'Lists things.',
      inputSchema: {
        skip: z.number().int().min(0).optional(),
        limit: z.number().int().min(1).max(100).optional(),
      },
      handler,
    },
  ];

  async function connect(): Promise<Client> {
    const factory = new McpServerFactory(
      { catalog: () => catalog } as unknown as McpTools,
      new FakeLogger().as<PinoLogger>(),
    );
    const server = factory.build({ keyId: 'k1', name: 'test-key', scopes: ['orgs:read'] as never });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    const client = new Client({ name: 'test-client', version: '0.0.0' });
    await client.connect(clientTransport);
    return client;
  }

  it('publishes the zod shape as JSON Schema in tools/list', async () => {
    const client = await connect();
    const { tools } = await client.listTools();
    const tool = tools.find((t) => t.name === 'list_things');

    expect(tool).toBeDefined();
    expect(tool!.inputSchema).toMatchObject({
      type: 'object',
      properties: {
        skip: expect.objectContaining({ type: 'integer', minimum: 0 }),
        limit: expect.objectContaining({ type: 'integer', minimum: 1, maximum: 100 }),
      },
    });
    await client.close();
  });

  it('validates tools/call arguments against the shape and forwards valid ones', async () => {
    const client = await connect();

    const ok = await client.callTool({ name: 'list_things', arguments: { skip: 0, limit: 5 } });
    expect(ok.isError).toBeFalsy();
    expect(handler).toHaveBeenCalledWith({ skip: 0, limit: 5 });

    const bad = await client.callTool({ name: 'list_things', arguments: { limit: 0 } });
    expect(bad.isError).toBe(true);
    await client.close();
  });
});
