/**
 * MCP tool scopes — what an API key may be granted, selected at key creation.
 *
 * Every MCP tool declares one scope; a key only ever sees the tools its
 * granted scopes cover. This is the exposure-control surface: creating a key
 * IS choosing which functions it can reach. Zod-free: ships to clients for
 * the key-creation UI.
 */
export const MCP_SCOPES = ['platform:read', 'orgs:read'] as const;
export type McpScope = (typeof MCP_SCOPES)[number];
