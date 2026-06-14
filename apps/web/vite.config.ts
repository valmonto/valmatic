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
      '/api': 'http://localhost:3000',
    },
  },
});
