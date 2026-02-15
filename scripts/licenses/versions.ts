#!/usr/bin/env node
/**
 * Dependency Version Checker
 *
 * Compares all workspace dependencies against npm registry latest versions.
 * Supports pnpm catalog: protocol by reading from pnpm-workspace.yaml.
 *
 * Usage:
 *   pnpm versions:check           - Check all dependencies
 *   pnpm versions:check --major   - Show only major updates
 *   pnpm versions:check --minor   - Show only minor updates
 *   pnpm versions:check --patch   - Show only patch updates
 */

import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

interface PackageJson {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

interface VersionInfo {
  package: string;
  current: string;
  latest: string;
  updateType: 'major' | 'minor' | 'patch' | 'prerelease' | 'current';
  source: 'catalog' | 'package.json';
  depType: 'prod' | 'dev' | 'peer' | 'catalog';
}

const ROOT_DIR = join(import.meta.dirname!, '../..');

function parseCatalog(): Map<string, string> {
  const catalog = new Map<string, string>();
  const workspacePath = join(ROOT_DIR, 'pnpm-workspace.yaml');

  try {
    const content = readFileSync(workspacePath, 'utf-8');
    const lines = content.split('\n');

    let inCatalog = false;
    for (const line of lines) {
      if (line.trim() === 'catalog:') {
        inCatalog = true;
        continue;
      }

      if (inCatalog) {
        // Check if we've left the catalog section (new top-level key)
        if (line.match(/^[a-zA-Z]/) && !line.startsWith(' ') && !line.startsWith('\t')) {
          break;
        }

        // Parse catalog entry: "  'package-name': version" or "  package-name: version"
        const match = line.match(/^\s+['"]?(@?[^'":\s]+)['"]?\s*:\s*['"]?([^'"]+)['"]?\s*$/);
        if (match) {
          const [, packageName, version] = match;
          catalog.set(packageName, version);
        }
      }
    }
  } catch {
    // No workspace file or can't read it
  }

  return catalog;
}

function findPackageJsonFiles(dir: string): string[] {
  const results: string[] = [];

  // Root package.json
  const rootPkg = join(dir, 'package.json');
  try {
    if (statSync(rootPkg).isFile()) {
      results.push(rootPkg);
    }
  } catch {
    // ignore
  }

  // apps/* and packages/*
  for (const subdir of ['apps', 'packages']) {
    const subdirPath = join(dir, subdir);
    try {
      const entries = readdirSync(subdirPath);
      for (const entry of entries) {
        const pkgPath = join(subdirPath, entry, 'package.json');
        try {
          if (statSync(pkgPath).isFile()) {
            results.push(pkgPath);
          }
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }
  }

  return results;
}

function parseVersion(version: string): string {
  // Remove semver range chars: ^, ~, >=, etc.
  return version.replace(/^[\^~>=<]+/, '').replace(/\s.*$/, '');
}

function getLatestVersion(packageName: string): string | null {
  try {
    const result = execSync(`npm view "${packageName}" version 2>/dev/null`, {
      encoding: 'utf-8',
      timeout: 15000,
    });
    return result.trim();
  } catch {
    return null;
  }
}

function compareVersions(current: string, latest: string): VersionInfo['updateType'] {
  if (current === latest) return 'current';

  // Check for prerelease
  if (current.includes('-') || latest.includes('-')) {
    return 'prerelease';
  }

  const currentParts = current.split('.').map(Number);
  const latestParts = latest.split('.').map(Number);

  const [curMajor = 0, curMinor = 0] = currentParts;
  const [latMajor = 0, latMinor = 0] = latestParts;

  if (curMajor !== latMajor) return 'major';
  if (curMinor !== latMinor) return 'minor';
  return 'patch';
}

function collectDependencies(
  packageJsonPaths: string[],
  catalog: Map<string, string>
): Map<string, { version: string; source: VersionInfo['source']; depType: VersionInfo['depType'] }> {
  const deps = new Map<string, { version: string; source: VersionInfo['source']; depType: VersionInfo['depType'] }>();

  // First, add all catalog dependencies
  for (const [name, version] of catalog) {
    deps.set(name, { version, source: 'catalog', depType: 'catalog' });
  }

  // Then, add package.json dependencies (that aren't using catalog:)
  for (const pkgPath of packageJsonPaths) {
    const content = readFileSync(pkgPath, 'utf-8');
    const pkg = JSON.parse(content) as PackageJson;

    const addDeps = (depsObj: Record<string, string> | undefined, depType: 'prod' | 'dev' | 'peer') => {
      if (!depsObj) return;
      for (const [name, version] of Object.entries(depsObj)) {
        // Skip workspace protocol and local packages
        if (version.startsWith('workspace:') || version.startsWith('file:') || version.startsWith('link:')) {
          continue;
        }
        // Skip catalog references (already handled above)
        if (version.startsWith('catalog:')) {
          continue;
        }
        // Skip if already in deps (catalog takes precedence or first occurrence)
        if (deps.has(name)) {
          continue;
        }

        deps.set(name, { version, source: 'package.json', depType });
      }
    };

    addDeps(pkg.dependencies, 'prod');
    addDeps(pkg.devDependencies, 'dev');
    addDeps(pkg.peerDependencies, 'peer');
  }

  return deps;
}

async function checkVersions(filter?: 'major' | 'minor' | 'patch'): Promise<void> {
  console.log('Scanning workspace for dependencies...\n');

  const catalog = parseCatalog();
  console.log(`Found ${catalog.size} packages in pnpm catalog`);

  const packageJsonPaths = findPackageJsonFiles(ROOT_DIR);
  console.log(`Found ${packageJsonPaths.length} package.json files`);

  const allDeps = collectDependencies(packageJsonPaths, catalog);
  console.log(`Total unique dependencies: ${allDeps.size}\n`);
  console.log('Checking npm registry for latest versions...\n');

  const results: VersionInfo[] = [];
  let checked = 0;

  for (const [packageName, info] of allDeps) {
    checked++;
    if (checked % 10 === 0 || checked === allDeps.size) {
      process.stdout.write(`\rChecked ${checked}/${allDeps.size} packages...`);
    }

    const latest = getLatestVersion(packageName);
    if (!latest) continue;

    const currentVersion = parseVersion(info.version);
    const updateType = compareVersions(currentVersion, latest);

    if (updateType !== 'current') {
      results.push({
        package: packageName,
        current: currentVersion,
        latest,
        updateType,
        source: info.source,
        depType: info.depType,
      });
    }
  }

  console.log(`\r${''.padEnd(50)}\r`); // Clear progress line

  // Filter if requested
  const filtered = filter ? results.filter((r) => r.updateType === filter) : results;

  // Group by update type
  const major = filtered.filter((r) => r.updateType === 'major');
  const minor = filtered.filter((r) => r.updateType === 'minor');
  const patch = filtered.filter((r) => r.updateType === 'patch');
  const prerelease = filtered.filter((r) => r.updateType === 'prerelease');

  console.log('=== Version Check Report ===\n');
  console.log(`Total packages: ${allDeps.size}`);
  console.log(`Up to date: ${allDeps.size - results.length}`);
  console.log(`Updates available: ${results.length}`);
  console.log(`  - Major: ${major.length}`);
  console.log(`  - Minor: ${minor.length}`);
  console.log(`  - Patch: ${patch.length}`);
  if (prerelease.length > 0) {
    console.log(`  - Prerelease: ${prerelease.length}`);
  }
  console.log('');

  const printSection = (title: string, items: VersionInfo[], color: string) => {
    if (items.length === 0) return;

    console.log(`${color}### ${title}${'\x1b[0m'}\n`);
    console.log('| Package | Current | Latest | Source |');
    console.log('|---------|---------|--------|--------|');

    for (const item of items.sort((a, b) => a.package.localeCompare(b.package))) {
      console.log(`| ${item.package} | ${item.current} | ${item.latest} | ${item.source} |`);
    }
    console.log('');
  };

  if (!filter || filter === 'major') {
    printSection('Major Updates (breaking changes possible)', major, '\x1b[31m');
  }
  if (!filter || filter === 'minor') {
    printSection('Minor Updates (new features)', minor, '\x1b[33m');
  }
  if (!filter || filter === 'patch') {
    printSection('Patch Updates (bug fixes)', patch, '\x1b[32m');
  }
  if (prerelease.length > 0 && !filter) {
    printSection('Prerelease Updates', prerelease, '\x1b[35m');
  }

  // Summary advice
  console.log('---');
  console.log('To update catalog packages, edit pnpm-workspace.yaml');
  console.log('To update package.json packages:');
  console.log('  pnpm update <package-name> --latest');
  console.log('');
  console.log('After updating, run:');
  console.log('  pnpm install && pnpm licenses:check');
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Dependency Version Checker

Usage:
  pnpm versions:check           Check all dependencies
  pnpm versions:check --major   Show only major updates
  pnpm versions:check --minor   Show only minor updates
  pnpm versions:check --patch   Show only patch updates

Options:
  --major    Filter to show only major version updates
  --minor    Filter to show only minor version updates
  --patch    Filter to show only patch version updates
  --help     Show this help message
`);
    return;
  }

  let filter: 'major' | 'minor' | 'patch' | undefined;
  if (args.includes('--major')) filter = 'major';
  if (args.includes('--minor')) filter = 'minor';
  if (args.includes('--patch')) filter = 'patch';

  await checkVersions(filter);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
