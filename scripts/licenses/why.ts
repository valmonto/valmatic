#!/usr/bin/env node
/**
 * License Dependency Tracer
 *
 * Finds the root dependency that pulls in a specific package.
 * Useful for understanding why certain licenses appear in your project.
 *
 * Usage:
 *   pnpm licenses:why <package-name>
 *   pnpm licenses:why sharp
 *   pnpm licenses:why @img/sharp-libvips-linux-x64
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface LicenseConfig {
  allowedLicenses: string[];
  reviewRequired: string[];
  forbidden: string[];
  ignoreDev: boolean;
  ignorePackages: string[];
  overrides: Record<string, string>;
}

interface PackageInfo {
  name: string;
  versions: string[];
  paths: string[];
  license: string;
  author?: string;
  homepage?: string;
  description?: string;
}

type LicenseData = Record<string, PackageInfo[]>;

function loadConfig(): LicenseConfig {
  const configPath = join(__dirname, 'config.json');
  return JSON.parse(readFileSync(configPath, 'utf-8')) as LicenseConfig;
}

function getLicenseData(): LicenseData {
  const result = execSync('pnpm licenses list --json', {
    encoding: 'utf-8',
    maxBuffer: 50 * 1024 * 1024,
  });
  return JSON.parse(result) as LicenseData;
}

function findPackageLicense(packageName: string, data: LicenseData): string | null {
  for (const [license, packages] of Object.entries(data)) {
    for (const pkg of packages) {
      if (pkg.name === packageName) {
        return license;
      }
    }
  }
  return null;
}

function tracePackage(packageName: string): void {
  console.log(`\nTracing dependency: ${packageName}\n`);

  try {
    const result = execSync(`pnpm -r why ${packageName} 2>&1`, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
    });

    if (result.trim()) {
      console.log(result);
    } else {
      console.log(`Package "${packageName}" not found in dependency tree.`);
      console.log('Try without the version suffix (e.g., "sharp" instead of "sharp@0.34.5")');
    }
  } catch {
    console.log(`Package "${packageName}" not found or pnpm why failed.`);
  }
}

function classifyLicense(license: string, config: LicenseConfig): string {
  const lower = license.toLowerCase();
  if (config.allowedLicenses.map((l) => l.toLowerCase()).includes(lower)) {
    return 'allowed';
  }
  if (config.reviewRequired.map((l) => l.toLowerCase()).includes(lower)) {
    return 'review-required';
  }
  if (config.forbidden.map((l) => l.toLowerCase()).includes(lower)) {
    return 'forbidden';
  }
  return 'unknown';
}

function showReviewRequired(): void {
  console.log('\n=== Packages Requiring Review ===\n');

  const config = loadConfig();
  const data = getLicenseData();

  const reviewPackages: Array<{ name: string; license: string; versions: string[] }> = [];

  for (const [license, packages] of Object.entries(data)) {
    const classification = classifyLicense(license, config);
    if (classification === 'review-required' || classification === 'forbidden' || classification === 'unknown') {
      for (const pkg of packages) {
        reviewPackages.push({
          name: pkg.name,
          license,
          versions: pkg.versions,
        });
      }
    }
  }

  if (reviewPackages.length === 0) {
    console.log('No packages require review.');
    return;
  }

  for (const pkg of reviewPackages) {
    const classification = classifyLicense(pkg.license, config);
    const status =
      classification === 'forbidden'
        ? '[FORBIDDEN]'
        : classification === 'review-required'
          ? '[REVIEW]'
          : '[UNKNOWN]';

    console.log(`${status} ${pkg.name}@${pkg.versions.join(', ')} (${pkg.license})`);
    tracePackage(pkg.name);
    console.log('---');
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
License Dependency Tracer

Usage:
  pnpm licenses:why <package-name>    Trace a specific package
  pnpm licenses:why --all             Show all packages requiring review with their traces

Examples:
  pnpm licenses:why sharp
  pnpm licenses:why @img/sharp-libvips-linux-x64
  pnpm licenses:why --all
`);
    return;
  }

  if (args[0] === '--all') {
    showReviewRequired();
    return;
  }

  // Remove version suffix if present (e.g., "sharp@0.34.5" -> "sharp")
  const packageName = args[0].replace(/@[\d.]+$/, '');

  const config = loadConfig();
  const data = getLicenseData();
  const license = findPackageLicense(packageName, data);

  if (license) {
    const classification = classifyLicense(license, config);
    const status =
      classification === 'allowed'
        ? '[OK]'
        : classification === 'forbidden'
          ? '[FORBIDDEN]'
          : classification === 'review-required'
            ? '[REVIEW]'
            : '[UNKNOWN]';
    console.log(`License: ${license} ${status}`);
  }

  tracePackage(packageName);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
