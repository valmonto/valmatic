import { FakeLogger } from '@pkg/testing';
import type { PinoLogger } from 'nestjs-pino';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { McpServerFactory } from '@/mcp/mcp-server.factory.js';
import type { McpTools } from '@/mcp/mcp-tools.js';

/**
 * The scoping contract: a key sees EXACTLY the tools its scopes cover, and the
 * filtering happens at registration — an out-of-scope tool does not exist for
 * that key, rather than existing and refusing.
 */
describe('McpServerFactory', () => {
  let factory: McpServerFactory;
  let registered: string[];

  const catalog = [
    { name: 'list_organizations', scope: 'orgs:read' as const, description: '', handler: vi.fn() },
    { name: 'platform_stats', scope: 'platform:read' as const, description: '', handler: vi.fn() },
  ];

  beforeEach(() => {
    factory = new McpServerFactory(
      { catalog: () => catalog } as unknown as McpTools,
      new FakeLogger().as<PinoLogger>(),
    );
  });

  function toolNamesFor(scopes: string[]): string[] {
    const server = factory.build({
      keyId: 'k1',
      name: 'test-key',
      scopes: scopes as never,
    });
    // The SDK keeps registered tools in a private map; its keys are the truth
    // of what this key can see.
    registered = Object.keys(
      (server as unknown as { _registeredTools: Record<string, unknown> })._registeredTools,
    );
    return registered;
  }

  it('shows a key exactly the tools its scopes cover', () => {
    expect(toolNamesFor(['orgs:read'])).toEqual(['whoami', 'list_organizations']);
  });

  it('shows everything to a key with every scope', () => {
    expect(toolNamesFor(['orgs:read', 'platform:read'])).toEqual([
      'whoami',
      'list_organizations',
      'platform_stats',
    ]);
  });

  // The exposure decision must fail CLOSED: an empty grant means the agent can
  // introspect its own key and nothing else.
  it('shows a scopeless key only whoami', () => {
    expect(toolNamesFor([])).toEqual(['whoami']);
  });

  it('ignores scopes that cover no tool', () => {
    expect(toolNamesFor(['made-up:scope'])).toEqual(['whoami']);
  });
});
