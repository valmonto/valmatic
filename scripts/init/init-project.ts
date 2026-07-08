#!/usr/bin/env node
/**
 * Project Initialization Script
 *
 * Sets up license files for a new project from this boilerplate.
 *
 * Usage:
 *   pnpm init:project
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import * as readline from 'node:readline';

const ROOT_DIR = join(import.meta.dirname!, '../..');

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.pnpm-store',
  'dist',
  'build',
  '.next',
  '.turbo',
  'coverage',
  'LICENSES',
]);

const IGNORED_FILES = new Set(['pnpm-lock.yaml', 'init-project.ts']);

function isValidProjectName(name: string): boolean {
  return /^[a-z][a-z0-9-]*$/.test(name) && !name.endsWith('-') && !name.includes('--');
}

/** Lowercase, alphanumeric-only segment (no hyphens) safe for a reverse-DNS id part. */
function toIdSegment(str: string): string {
  const seg = str.toLowerCase().replace(/[^a-z0-9]/g, '');
  return /^[a-z]/.test(seg) ? seg : `app${seg}`;
}

/** Turn a project slug into a display name: "my-project" → "My Project". */
function toDisplayName(name: string): string {
  return name
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function getAllFiles(dir: string, files: string[] = []): string[] {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      if (!IGNORED_DIRS.has(entry)) {
        getAllFiles(fullPath, files);
      }
    } else if (stat.isFile() && !IGNORED_FILES.has(entry)) {
      files.push(fullPath);
    }
  }

  return files;
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceText(opts: {
  filePath: string;
  matchText: string;
  newText: string;
  modifiedFiles: string[];
}) {
  let replacements = 0;
  try {
    const content = readFileSync(opts.filePath, 'utf-8');
    if (content.includes(opts.matchText)) {
      const newContent = content.replaceAll(opts.matchText, opts.newText);

      const escaped = escapeRegExp(opts.matchText);
      const regex = new RegExp(escaped, 'g');
      const count = (content.match(regex) || []).length;

      writeFileSync(opts.filePath, newContent, 'utf-8');
      opts.modifiedFiles.push(relative(ROOT_DIR, opts.filePath));
      replacements += count;
    }
  } catch {
    // Skip binary files or files that can't be read as text
  }
  return replacements;
}

function replaceBoilerplatePlaceholder(projectName: string): { replaced: number; files: string[] } {
  const files = getAllFiles(ROOT_DIR);
  const modifiedFiles: string[] = [];
  let totalReplacements = 0;

  for (const filePath of files) {
    for (const target of ['vboilerplate']) {
      totalReplacements += replaceText({
        filePath: filePath,
        matchText: target,
        newText: projectName,
        modifiedFiles,
      });
    }
  }

  return { replaced: totalReplacements, files: modifiedFiles };
}

const BOILERPLATE_LICENSE = `MIT License

Copyright (c) 2026 Valmonto, MB

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;

function generateNotice(owner: string, year: string, usesMIT: boolean): string {
  return `NOTICES
=======

This project is built using the Valmonto Boilerplate (Valmatic).

## Valmonto Boilerplate (Valmatic)

Copyright (c) 2026 Valmonto, MB
Licensed under the MIT License
See: LICENSES/boilerplate-MIT.txt

## ${owner}

Copyright (c) ${year} ${owner}
${usesMIT ? 'Licensed under the MIT License' : 'See: LICENSE'}

## Third-Party Dependencies

See THIRD_PARTY_LICENSES.md for a complete list of third-party
dependencies and their licenses.
`;
}

type MobileConfig = {
  displayName: string;
  scheme: string;
  bundleId: string;
  /** Universal-link domain, or '' to disable app links entirely. */
  domain: string;
};

/**
 * Rewrites `apps/mobile/app.json` with the new app's identity (display name, slug,
 * URL scheme, iOS/Android ids, universal-link domain) and refreshes the matching
 * references in the mobile docs. Native ids must be unique per app, so unlike the
 * web display name they can't ride the `vboilerplate` token swap.
 */
function configureMobileApp(cfg: MobileConfig, modifiedFiles: string[]): boolean {
  const appJsonPath = join(ROOT_DIR, 'apps/mobile/app.json');
  if (!existsSync(appJsonPath)) return false;

  const app = JSON.parse(readFileSync(appJsonPath, 'utf-8'));
  const expo = app.expo ?? {};
  const prevScheme: string | undefined = expo.scheme;
  const prevBundleId: string | undefined = expo.ios?.bundleIdentifier;
  const prevDomain: string | undefined = expo.ios?.associatedDomains?.[0]?.replace(/^applinks:/, '');

  expo.name = cfg.displayName;
  expo.slug = cfg.scheme;
  expo.scheme = cfg.scheme;

  expo.ios = expo.ios ?? {};
  expo.ios.bundleIdentifier = cfg.bundleId;
  expo.android = expo.android ?? {};
  expo.android.package = cfg.bundleId;

  if (cfg.domain) {
    expo.ios.associatedDomains = [`applinks:${cfg.domain}`];
    // Point the existing https intent filter at the new domain (keep other filters).
    for (const filter of expo.android.intentFilters ?? []) {
      for (const data of filter.data ?? []) {
        if (data.scheme === 'https') data.host = cfg.domain;
      }
    }
  } else {
    // No domain provided → don't claim the boilerplate's universal links.
    delete expo.ios.associatedDomains;
    expo.android.intentFilters = (expo.android.intentFilters ?? []).filter(
      (f: { data?: { scheme?: string }[] }) => !f.data?.some((d) => d.scheme === 'https'),
    );
    if (expo.android.intentFilters.length === 0) delete expo.android.intentFilters;
  }

  app.expo = expo;
  writeFileSync(appJsonPath, JSON.stringify(app, null, 2) + '\n', 'utf-8');
  modifiedFiles.push(relative(ROOT_DIR, appJsonPath));

  // Refresh the stale identifiers embedded in the mobile docs/source.
  const docTargets = getAllFiles(join(ROOT_DIR, 'apps/mobile/docs'));
  const tokens: [string, string][] = [];
  if (prevScheme && prevScheme !== cfg.scheme) tokens.push([`${prevScheme}://`, `${cfg.scheme}://`]);
  if (prevBundleId && prevBundleId !== cfg.bundleId) tokens.push([prevBundleId, cfg.bundleId]);
  if (cfg.domain && prevDomain && prevDomain !== cfg.domain) tokens.push([prevDomain, cfg.domain]);

  for (const filePath of docTargets) {
    for (const [from, to] of tokens) {
      replaceText({ filePath, matchText: from, newText: to, modifiedFiles });
    }
  }

  return true;
}

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer: string) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main(): Promise<void> {
  console.log('\n🚀 Project Initialization\n');

  // Project name
  const projectName = await prompt(
    'Project name (lowercase, no spaces, no dashes, e.g. myproject): ',
  );
  if (!projectName) {
    console.error('Project name is required.');
    process.exit(1);
  }
  if (!isValidProjectName(projectName)) {
    console.error(
      'Invalid project name. Must be lowercase, start with a letter, and contain only letters, numbers, and hyphens.',
    );
    process.exit(1);
  }

  // Owner/Company
  const owner = await prompt('Owner/Company name: ');
  if (!owner) {
    console.error('Owner name is required.');
    process.exit(1);
  }

  // License selection
  console.log('\nLicense options:');
  console.log('  1. MIT - Same as boilerplate');
  console.log('  2. Custom - Create placeholder for you to fill in');

  const licenseChoice = await prompt('\nSelect (1-2): ');
  const usesMIT = licenseChoice !== '2';

  // Mobile app identity (skippable — Enter accepts the shown default).
  let mobileConfig: MobileConfig | null = null;
  const hasMobile = existsSync(join(ROOT_DIR, 'apps/mobile/app.json'));
  if (hasMobile) {
    console.log('\n📱 Mobile app (apps/mobile) — press Enter to accept defaults:');
    const defName = toDisplayName(projectName);
    const defBundle = `com.${toIdSegment(owner)}.${toIdSegment(projectName)}`;
    const displayName = (await prompt(`  Display name [${defName}]: `)) || defName;
    const scheme = (await prompt(`  URL scheme [${projectName}]: `)) || projectName;
    const bundleId = (await prompt(`  Bundle/package id [${defBundle}]: `)) || defBundle;
    const domain = await prompt('  Universal-link domain (blank to disable, e.g. app.example.com): ');
    mobileConfig = { displayName, scheme, bundleId, domain };
  }

  const year = new Date().getFullYear().toString();

  console.log('\n📝 Creating files...\n');

  // Create LICENSES directory
  const licensesDir = join(ROOT_DIR, 'LICENSES');
  if (!existsSync(licensesDir)) {
    mkdirSync(licensesDir);
  }

  // Save original boilerplate license
  writeFileSync(join(licensesDir, 'boilerplate-MIT.txt'), BOILERPLATE_LICENSE, 'utf-8');
  console.log('✓ LICENSES/boilerplate-MIT.txt');

  // Handle LICENSE file
  if (usesMIT) {
    const mitLicense = `MIT License

Copyright (c) ${year} ${owner}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;
    writeFileSync(join(ROOT_DIR, 'LICENSE'), mitLicense, 'utf-8');
    console.log('✓ LICENSE (MIT)');
  } else {
    const placeholder = `Copyright (c) ${year} ${owner}

[INSERT YOUR LICENSE TEXT HERE]

---
Note: This project includes code from the Valmonto Boilerplate - Valmatic (MIT License).
See LICENSES/boilerplate-MIT.txt for details.
`;
    writeFileSync(join(ROOT_DIR, 'LICENSE'), placeholder, 'utf-8');
    console.log('✓ LICENSE (placeholder - fill in your text)');
  }

  // Create NOTICE file
  writeFileSync(join(ROOT_DIR, 'NOTICE'), generateNotice(owner, year, usesMIT), 'utf-8');
  console.log('✓ NOTICE');

  // Replace _boilerplate placeholders
  console.log('\n🔄 Replacing _boilerplate placeholders...\n');
  const { replaced, files } = replaceBoilerplatePlaceholder(projectName);
  if (replaced > 0) {
    console.log(`✓ Replaced ${replaced} occurrence(s) in ${files.length} file(s):`);
    for (const file of files) {
      console.log(`  - ${file}`);
    }
  } else {
    console.log('  No _boilerplate placeholders found.');
  }

  // Configure the mobile app's native identity (app.json + docs)
  if (mobileConfig) {
    console.log('\n📱 Configuring mobile app...\n');
    const mobileModified: string[] = [];
    configureMobileApp(mobileConfig, mobileModified);
    console.log(`✓ Updated ${mobileModified.length} mobile file(s):`);
    for (const file of mobileModified) {
      console.log(`  - ${file}`);
    }
  }

  // Regenerate third-party licenses
  console.log('\n📦 Regenerating third-party licenses...');
  const { execSync } = await import('node:child_process');
  try {
    execSync('pnpm licenses:generate', { cwd: ROOT_DIR, stdio: 'inherit' });
  } catch {
    console.log('⚠ Run pnpm licenses:generate manually');
  }

  console.log('\n✅ Done!\n');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
