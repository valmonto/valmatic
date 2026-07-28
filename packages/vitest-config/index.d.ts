import type { UserConfig } from 'vitest/config';

/** Absolute paths mapping `@pkg/*` specifiers to TypeScript source. */
export declare const workspaceAliases: Record<string, string>;

/** Shared Vitest config for Node-side workspaces. */
export declare function base(overrides?: UserConfig): UserConfig;

/** Shared Vitest config for React workspaces (jsdom + React plugin). */
export declare function react(overrides?: UserConfig): UserConfig;
