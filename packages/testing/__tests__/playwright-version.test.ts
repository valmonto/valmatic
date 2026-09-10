import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const read = (p: string): string => readFileSync(resolve(repoRoot, p), 'utf8');

/**
 * Playwright's version is declared TWICE — in the catalog, and in the base
 * image tag of the e2e Dockerfile — and nothing but this test keeps them in
 * step.
 *
 * Playwright resolves its browser by a revision baked into the package, so the
 * two drifting apart does not fail loudly. The image simply provides browsers
 * for one revision while the code looks for another, and every browser test
 * dies at RUNTIME with
 *
 *   browserType.launch: Executable doesn't exist at
 *   /ms-playwright/chromium_headless_shell-<rev>/…
 *
 * A descendant shipped exactly that drift — a Dockerfile pinned to 1.60.0
 * against a catalog on 1.62.1 — and it took every browser scraper down for days
 * before anyone connected the error to the version pair. The comment above the
 * offending line even claimed the two were pinned together.
 */
describe('playwright version is declared consistently', () => {
  const catalogVersion = /'@playwright\/test':\s*([0-9]+\.[0-9]+\.[0-9]+)/.exec(
    read('pnpm-workspace.yaml'),
  )?.[1];

  it('is pinned to an exact version in the catalog', () => {
    expect(catalogVersion).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("matches the e2e image's playwright tag, which supplies the browsers", () => {
    const imageVersion = /mcr\.microsoft\.com\/playwright:v([0-9]+\.[0-9]+\.[0-9]+)/.exec(
      read('apps/e2e/Dockerfile'),
    )?.[1];

    expect(imageVersion).toBe(catalogVersion);
  });

  /**
   * A hardcoded `playwright@x.y.z` anywhere in a Dockerfile is the same trap by
   * another route: it installs browsers for a version the image may not run.
   * Resolve the installer from the package that depends on playwright instead.
   */
  it('never installs browsers from a hardcoded version', () => {
    for (const app of ['api', 'worker', 'web', 'e2e']) {
      let dockerfile: string;
      try {
        dockerfile = read(`apps/${app}/Dockerfile`);
      } catch {
        continue; // not every app ships one
      }
      expect(dockerfile, `apps/${app}/Dockerfile`).not.toMatch(/playwright@\d/);
    }
  });
});
