import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const read = (p: string): string => readFileSync(resolve(repoRoot, p), 'utf8');

/** Dockerfile lines with comments stripped — prose about a version is not a pin. */
const instructions = (text: string): string =>
  text
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('#'))
    .join('\n');

/** Every app Dockerfile in the repo, whatever the apps happen to be called. */
function appDockerfiles(): string[] {
  const appsDir = resolve(repoRoot, 'apps');
  if (!existsSync(appsDir)) return [];
  return readdirSync(appsDir)
    .map((app) => `apps/${app}/Dockerfile`)
    .filter((p) => existsSync(resolve(repoRoot, p)));
}

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
 * A repo in this family shipped exactly that drift — a Dockerfile pinned to
 * 1.60.0 against a catalog on 1.62.1 — and it took every browser scraper down
 * for days before anyone connected the error to the version pair. The comment
 * above the offending line even claimed the two were pinned together.
 */
describe('playwright version is declared consistently', () => {
  const catalogVersion = /'@playwright\/test':\s*([0-9]+\.[0-9]+\.[0-9]+)/.exec(
    read('pnpm-workspace.yaml'),
  )?.[1];

  it('is pinned to an exact version in the catalog', () => {
    expect(catalogVersion).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("matches the e2e image's playwright tag, which supplies the browsers", () => {
    const e2e = 'apps/e2e/Dockerfile';
    if (!existsSync(resolve(repoRoot, e2e))) return; // not every repo ships one

    const imageVersion = /mcr\.microsoft\.com\/playwright:v([0-9]+\.[0-9]+\.[0-9]+)/.exec(
      instructions(read(e2e)),
    )?.[1];

    expect(imageVersion).toBe(catalogVersion);
  });

  /**
   * A hardcoded `playwright@x.y.z` in an install line is the same trap by
   * another route: it installs browsers for a version the image may not run.
   * Resolve the installer from the package that depends on playwright instead.
   *
   * Comments are stripped first — several of these Dockerfiles describe the old
   * mistake in prose, and prose is not a pin.
   */
  it('never installs browsers from a hardcoded version', () => {
    for (const path of appDockerfiles()) {
      expect(instructions(read(path)), path).not.toMatch(/playwright@\d/);
    }
  });
});
