#!/usr/bin/env node
/**
 * License Checker Script
 *
 * Validates all dependencies against allowed license list and generates
 * THIRD_PARTY_LICENSES.md file.
 *
 * Usage:
 *   pnpm licenses:check       - Check licenses and fail on violations
 *   pnpm licenses:generate    - Generate THIRD_PARTY_LICENSES.md
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
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

function parseCatalog(): Set<string> {
  const catalog = new Set<string>();
  const workspacePath = join(__dirname, '../../pnpm-workspace.yaml');

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
          catalog.add(match[1]);
        }
      }
    }
  } catch {
    // No workspace file or can't read it
  }

  return catalog;
}

interface ValidationResult {
  allowed: PackageInfo[];
  reviewRequired: PackageInfo[];
  forbidden: PackageInfo[];
  unknown: PackageInfo[];
}

function loadConfig(): LicenseConfig {
  const configPath = join(__dirname, 'config.json');
  return JSON.parse(readFileSync(configPath, 'utf-8')) as LicenseConfig;
}

function getLicenseData(): LicenseData {
  const result = execSync('pnpm licenses list --json', {
    encoding: 'utf-8',
    maxBuffer: 50 * 1024 * 1024, // 50MB buffer for large projects
  });
  return JSON.parse(result) as LicenseData;
}

function normalizeLicense(license: string): string {
  return license.trim();
}

function validateLicenses(data: LicenseData, config: LicenseConfig): ValidationResult {
  const result: ValidationResult = {
    allowed: [],
    reviewRequired: [],
    forbidden: [],
    unknown: [],
  };

  const allowedSet = new Set(config.allowedLicenses.map((l) => l.toLowerCase()));
  const reviewSet = new Set(config.reviewRequired.map((l) => l.toLowerCase()));
  const forbiddenSet = new Set(config.forbidden.map((l) => l.toLowerCase()));
  const ignoreSet = new Set(config.ignorePackages);

  for (const [license, packages] of Object.entries(data)) {
    const normalizedLicense = normalizeLicense(license).toLowerCase();

    for (const pkg of packages) {
      // Skip ignored packages
      if (ignoreSet.has(pkg.name)) {
        continue;
      }

      // Check for override
      const effectiveLicense = config.overrides[pkg.name]
        ? config.overrides[pkg.name].toLowerCase()
        : normalizedLicense;

      // Categorize
      if (allowedSet.has(effectiveLicense)) {
        result.allowed.push({ ...pkg, license });
      } else if (reviewSet.has(effectiveLicense)) {
        result.reviewRequired.push({ ...pkg, license });
      } else if (forbiddenSet.has(effectiveLicense)) {
        result.forbidden.push({ ...pkg, license });
      } else {
        result.unknown.push({ ...pkg, license });
      }
    }
  }

  return result;
}

function generateThirdPartyLicenses(data: LicenseData, _config: LicenseConfig): string {
  const catalog = parseCatalog();

  const lines: string[] = [
    '# Third-Party Licenses',
    '',
    `> Auto-generated on ${new Date().toISOString().split('T')[0]}`,
    '> Run `pnpm licenses:generate` to update this file.',
    '',
    'This project uses the following third-party packages:',
    '',
  ];

  // Separate direct (catalog) and transitive dependencies
  const directDeps: PackageInfo[] = [];
  const transitiveDeps: PackageInfo[] = [];

  for (const [license, packages] of Object.entries(data)) {
    for (const pkg of packages) {
      const pkgWithLicense = { ...pkg, license };
      if (catalog.has(pkg.name)) {
        directDeps.push(pkgWithLicense);
      } else {
        transitiveDeps.push(pkgWithLicense);
      }
    }
  }

  // Summary
  lines.push('## Summary');
  lines.push('');
  lines.push(`- **Direct dependencies:** ${directDeps.length} packages (from pnpm catalog)`);
  lines.push(`- **Transitive dependencies:** ${transitiveDeps.length} packages`);
  lines.push(`- **Total:** ${directDeps.length + transitiveDeps.length} packages`);
  lines.push('');

  // License breakdown table
  const licenseGroups = new Map<string, { direct: number; transitive: number }>();
  for (const pkg of directDeps) {
    const counts = licenseGroups.get(pkg.license) || { direct: 0, transitive: 0 };
    counts.direct++;
    licenseGroups.set(pkg.license, counts);
  }
  for (const pkg of transitiveDeps) {
    const counts = licenseGroups.get(pkg.license) || { direct: 0, transitive: 0 };
    counts.transitive++;
    licenseGroups.set(pkg.license, counts);
  }

  const sortedLicenses = Array.from(licenseGroups.keys()).sort();

  lines.push('### License Breakdown');
  lines.push('');
  lines.push('| License | Direct | Transitive | Total |');
  lines.push('|---------|--------|------------|-------|');

  for (const license of sortedLicenses) {
    const counts = licenseGroups.get(license)!;
    const total = counts.direct + counts.transitive;
    lines.push(`| ${license} | ${counts.direct} | ${counts.transitive} | ${total} |`);
  }

  lines.push('');

  // Direct dependencies section
  lines.push('## Direct Dependencies');
  lines.push('');
  lines.push('These packages are explicitly declared in `pnpm-workspace.yaml` catalog:');
  lines.push('');

  // Group direct deps by license
  const directByLicense = new Map<string, PackageInfo[]>();
  for (const pkg of directDeps) {
    const existing = directByLicense.get(pkg.license) || [];
    existing.push(pkg);
    directByLicense.set(pkg.license, existing);
  }

  for (const license of Array.from(directByLicense.keys()).sort()) {
    const packages = directByLicense.get(license)!;
    lines.push(`### ${license}`);
    lines.push('');

    for (const pkg of packages.sort((a, b) => a.name.localeCompare(b.name))) {
      const version = pkg.versions.join(', ');
      const homepage = pkg.homepage ? ` - [Homepage](${pkg.homepage})` : '';
      lines.push(`- **${pkg.name}** (${version})${homepage}`);
      if (pkg.description) {
        lines.push(`  - ${pkg.description}`);
      }
    }

    lines.push('');
  }

  // Transitive dependencies section
  lines.push('## Transitive Dependencies');
  lines.push('');
  lines.push('These packages are installed as dependencies of direct dependencies:');
  lines.push('');

  // Group transitive deps by license
  const transitiveByLicense = new Map<string, PackageInfo[]>();
  for (const pkg of transitiveDeps) {
    const existing = transitiveByLicense.get(pkg.license) || [];
    existing.push(pkg);
    transitiveByLicense.set(pkg.license, existing);
  }

  for (const license of Array.from(transitiveByLicense.keys()).sort()) {
    const packages = transitiveByLicense.get(license)!;
    lines.push(`### ${license}`);
    lines.push('');

    for (const pkg of packages.sort((a, b) => a.name.localeCompare(b.name))) {
      const version = pkg.versions.join(', ');
      const homepage = pkg.homepage ? ` - [Homepage](${pkg.homepage})` : '';
      lines.push(`- **${pkg.name}** (${version})${homepage}`);
    }

    lines.push('');
  }

  // Attribution notices
  lines.push('## Attribution Notices');
  lines.push('');
  lines.push('This software includes packages licensed under various open source licenses.');
  lines.push('See individual package repositories for full license texts and copyright notices.');
  lines.push('');

  // Special attributions
  if (licenseGroups.has('CC-BY-4.0')) {
    lines.push('### Creative Commons Attribution');
    lines.push('');
    lines.push(
      'Browser compatibility data from [Can I Use](https://caniuse.com) is licensed under CC-BY-4.0.',
    );
    lines.push('');
  }

  return lines.join('\n');
}

function printReport(result: ValidationResult): void {
  console.log('\n=== License Check Report ===\n');

  console.log(`Allowed licenses: ${result.allowed.length} packages`);

  if (result.reviewRequired.length > 0) {
    console.log(`\nReview required (${result.reviewRequired.length} packages):`);
    for (const pkg of result.reviewRequired) {
      console.log(`  - ${pkg.name}@${pkg.versions.join(', ')} (${pkg.license})`);
    }
  }

  if (result.forbidden.length > 0) {
    console.log(`\nForbidden licenses (${result.forbidden.length} packages):`);
    for (const pkg of result.forbidden) {
      console.log(`  - ${pkg.name}@${pkg.versions.join(', ')} (${pkg.license})`);
    }
  }

  if (result.unknown.length > 0) {
    console.log(`\nUnknown licenses (${result.unknown.length} packages):`);
    for (const pkg of result.unknown) {
      console.log(`  - ${pkg.name}@${pkg.versions.join(', ')} (${pkg.license})`);
    }
  }

  console.log('');
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0] || 'check';

  const config = loadConfig();
  const data = getLicenseData();
  const result = validateLicenses(data, config);

  if (command === 'generate') {
    const content = generateThirdPartyLicenses(data, config);
    const outputPath = join(__dirname, '../../THIRD_PARTY_LICENSES.md');
    writeFileSync(outputPath, content, 'utf-8');
    console.log(`Generated: THIRD_PARTY_LICENSES.md`);
    printReport(result);
    return;
  }

  // Default: check
  printReport(result);

  const hasViolations = result.forbidden.length > 0 || result.unknown.length > 0;
  const hasReviewRequired = result.reviewRequired.length > 0;

  if (hasViolations) {
    console.error('License check FAILED - forbidden or unknown licenses found');
    process.exit(1);
  }

  if (hasReviewRequired) {
    console.warn('License check PASSED with warnings - some licenses require review');
    console.warn('Add packages to ignorePackages in config.json after legal review');
    process.exit(0);
  }

  console.log('License check PASSED');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
