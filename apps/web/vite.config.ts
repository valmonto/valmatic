import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';
import { existsSync, readdirSync, readFileSync } from 'fs';

const packagesDir = resolve(__dirname, '../../packages');

/**
 * Alias every workspace package to its `src/` entry so Vite resolves from source in dev.
 *
 * The packages' `exports.import` points at built `dist/` (gitignored), so a fresh checkout,
 * branch switch, or the watcher losing a startup race with Vite would 500 with
 * "Failed to resolve import @pkg/…". Resolving from source removes the dependency on build
 * order entirely (and gives HMR straight from package source). Mirrors the tsconfig paths.
 */
function workspaceSourceAliases(): Record<string, string> {
  const aliases: Record<string, string> = {};
  for (const dir of readdirSync(packagesDir)) {
    const pkgJsonPath = resolve(packagesDir, dir, 'package.json');
    if (!existsSync(pkgJsonPath)) continue;
    const { name } = JSON.parse(readFileSync(pkgJsonPath, 'utf8')) as { name?: string };
    const entry = ['src/index.ts', 'src/index.tsx']
      .map((f) => resolve(packagesDir, dir, f))
      .find(existsSync);
    if (name && entry) aliases[name] = entry;
  }

  // `@pkg/contracts` resolves to its client entry in the browser: every type,
  // plus the Zod-free constants and permission helpers. The root entry
  // re-exports the whole schema graph, so importing it here would ship Zod for
  // the sake of a regex. Code that must validate client-side imports
  // `@pkg/contracts/schemas` explicitly — visible in review, not accidental.
  // Aliases match by prefix in insertion order, so the bare specifier must come
  // after its subpaths or it would swallow them.
  delete aliases['@pkg/contracts'];
  const contractsSrc = resolve(packagesDir, 'contracts/src');
  aliases['@pkg/contracts/schemas'] = resolve(contractsSrc, 'schemas/index.ts');
  aliases['@pkg/contracts/permissions'] = resolve(contractsSrc, 'permissions/index.ts');
  aliases['@pkg/contracts/constants'] = resolve(contractsSrc, 'constants/index.ts');
  aliases['@pkg/contracts/types'] = resolve(contractsSrc, 'types/index.ts');
  aliases['@pkg/contracts/client'] = resolve(contractsSrc, 'client/index.ts');
  aliases['@pkg/contracts'] = resolve(contractsSrc, 'client/index.ts');

  return aliases;
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      ...workspaceSourceAliases(),
    },
  },
  server: {
    proxy: {
      // Defaults to the local dev api. A throwaway build stack (scripts/dev-stack.sh)
      // runs the api on a non-default port and points the proxy there via
      // API_PROXY_TARGET so its Vite serves /api from its own api, not :3000.
      '/api': process.env.API_PROXY_TARGET || 'http://localhost:3000',
    },
  },
});
