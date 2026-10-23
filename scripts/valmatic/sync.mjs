#!/usr/bin/env node
/**
 * What a project keeps of the template, from valmatic.json: its add-ons
 * (optional parts) and its languages. See docs/addons.md.
 *
 *   pnpm valmatic:sync    write the generated files from valmatic.json, and
 *                         remove the add-ons and languages it does not list
 *   pnpm valmatic:check   change nothing; fail if anything is out of step
 *
 * Flags for `sync`:
 *   --new-project  allowed to rebuild the database migrations from scratch
 *                  (only for a project whose database does not exist yet)
 *   --minimal      turn every add-on off and keep only English first (CI uses
 *                  it to prove the rest works without them)
 *   --verify       afterwards run `pnpm install` and `pnpm verify`
 *
 * An add-on called `mobile` is, by convention:
 *   - an `addons/mobile/` folder in any layer below (its tests inside it);
 *   - the app `apps/mobile`, if there is one (other apps are core);
 *   - `# addon:mobile begin/end` regions in pnpm-workspace.yaml, and root
 *     scripts ending in `:mobile`.
 * Each layer has ONE generated file, `addons.generated.ts`, that imports the
 * add-ons present. Hand-written code imports only that file, never an add-on
 * folder — `--check` fails on any other import of `addons/`.
 */
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '../..');
const CONFIG = join(ROOT, 'valmatic.json');
const RESERVED = new Set(['api', 'web', 'worker']);

const HEADER = '// Written by `pnpm valmatic:sync` from valmatic.json. Do not edit.\n';
const TRANSLATIONS = 'packages/locales/src/translations';
/** The reference language: every text exists in it first. Always kept. */
const REFERENCE_LANGUAGE = 'en';

/** Set by readConfig: the languages this project keeps, in order. */
let LANGUAGES = [];
let DEFAULT_LANGUAGE = REFERENCE_LANGUAGE;

/** Where add-ons live in each layer, and what that layer's generated file says. */
const LAYERS = [
  { dir: 'packages/contracts/src', write: reexports('.js') },
  { dir: 'packages/database/src/schema', write: reexports('.js'), database: true },
  { dir: 'packages/locales/src', write: locales },
  { dir: 'apps/api/src', write: nestModules },
  { dir: 'apps/worker/src', write: nestModules },
  { dir: 'apps/web/src', write: webAddons },
];

// --- generated files ---------------------------------------------------------

function reexports(ext) {
  return (names) =>
    HEADER +
    (names.length === 0
      ? 'export {};\n'
      : names.map((n) => `export * from './addons/${n}/index${ext}';\n`).join(''));
}

/** `addonModule` from each add-on's index, for the root Nest module's imports. */
function nestModules(names) {
  const imports = names
    .map((n) => `import { addonModule as ${ident(n)} } from './addons/${n}/index.js';\n`)
    .join('');
  return (
    HEADER +
    "import type { DynamicModule, Type } from '@nestjs/common';\n" +
    imports +
    '\n' +
    `export const addonModules: Array<Type<unknown> | DynamicModule> = [${names.map(ident).join(', ')}];\n`
  );
}

/** `addon` from each add-on's index: its routes, navigation and commands. */
function webAddons(names) {
  const imports = names
    .map((n) => `import { addon as ${ident(n)} } from './addons/${n}';\n`)
    .join('');
  return (
    HEADER +
    "import type { Addon } from '@/lib/addon';\n" +
    imports +
    '\n' +
    `export const addons: Addon[] = [${names.map(ident).join(', ')}];\n`
  );
}

/** Each add-on's keys under its own name in `k`, and its texts per language. */
function locales(names) {
  const languages = LANGUAGES;
  let out = HEADER;
  for (const n of names) {
    out += `import { keys as ${ident(n)} } from './addons/${n}/keys.js';\n`;
    for (const lang of languages) {
      out += `import ${ident(n)}_${lang} from './addons/${n}/${lang}.json' with { type: 'json' };\n`;
    }
  }
  out += `\nexport const addonKeys = { ${names.map(ident).join(', ')} } as const;\n\n`;
  out += 'export const addonTranslations = {\n';
  for (const lang of languages) {
    out += `  ${lang}: { ${names.map((n) => `...${ident(n)}_${lang}`).join(', ')} },\n`;
  }
  out += '} as const;\n';
  return out.replace('{  }', '{}');
}

/** The kept languages, the default, and every language's texts (core and add-ons). */
function languagesFile() {
  let out = HEADER;
  for (const lang of LANGUAGES) {
    out += `import ${lang} from './translations/${lang}.json' with { type: 'json' };\n`;
  }
  out += "import { addonTranslations } from './addons.generated.js';\n\n";
  out += `export const supportedLanguages = [${LANGUAGES.map((l) => `'${l}'`).join(', ')}] as const;\n\n`;
  out += `export const defaultLanguage = '${DEFAULT_LANGUAGE}' as const;\n\n`;
  out += 'export const translations = {\n';
  for (const lang of LANGUAGES) out += `  ${lang}: { ...${lang}, ...addonTranslations.${lang} },\n`;
  out += '} as const;\n';
  return out;
}

function ident(name) {
  return name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

// --- reading the tree --------------------------------------------------------

function readConfig() {
  if (!existsSync(CONFIG)) fail('valmatic.json is missing.');
  const config = JSON.parse(readFileSync(CONFIG, 'utf8'));
  const addons = config.addons ?? {};
  for (const [name, on] of Object.entries(addons)) {
    if (!/^[a-z][a-z0-9-]*$/.test(name)) fail(`Add-on name "${name}" must be lowercase-kebab.`);
    if (RESERVED.has(name)) fail(`"${name}" is a core app and cannot be an add-on.`);
    if (typeof on !== 'boolean') fail(`valmatic.json: addons.${name} must be true or false.`);
  }
  const available = readdirSync(join(ROOT, TRANSLATIONS))
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''));
  const languages = config.languages ?? available.sort();
  const defaultLanguage = config.defaultLanguage ?? REFERENCE_LANGUAGE;
  if (!Array.isArray(languages) || languages.some((l) => !/^[a-z]{2,3}$/.test(l))) {
    fail('valmatic.json: languages must be a list of language codes, e.g. ["en", "lt"].');
  }
  if (!languages.includes(REFERENCE_LANGUAGE)) {
    fail(`valmatic.json: languages must include "${REFERENCE_LANGUAGE}", the reference language.`);
  }
  if (!languages.includes(defaultLanguage)) {
    fail(`valmatic.json: defaultLanguage "${defaultLanguage}" is not in languages.`);
  }
  for (const lang of languages) {
    if (!available.includes(lang)) {
      fail(
        `"${lang}" has no ${TRANSLATIONS}/${lang}.json. Copy en.json to it and translate it ` +
          "(and each add-on's en.json), then sync again.",
      );
    }
  }
  LANGUAGES = [REFERENCE_LANGUAGE, ...languages.filter((l) => l !== REFERENCE_LANGUAGE)];
  DEFAULT_LANGUAGE = defaultLanguage;
  return { config, addons, available };
}

/** Translation files of languages valmatic.json does not keep. */
function unkeptTranslations() {
  const files = [];
  const dirs = [
    TRANSLATIONS,
    ...subdirs('packages/locales/src/addons').map((n) => `packages/locales/src/addons/${n}`),
  ];
  for (const dir of dirs) {
    for (const f of readdirSync(join(ROOT, dir))) {
      const lang = f.replace(/\.json$/, '');
      if (f.endsWith('.json') && !LANGUAGES.includes(lang)) files.push(`${dir}/${f}`);
    }
  }
  return files;
}

function subdirs(dir) {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs)
    .filter((e) => statSync(join(abs, e)).isDirectory())
    .sort();
}

/**
 * Every place an add-on has something, by name. An app under `apps/` counts
 * only when valmatic.json names an add-on after it: the other apps are core.
 */
function presence(listed) {
  const found = new Map();
  const add = (name, path) => found.set(name, [...(found.get(name) ?? []), path]);
  for (const layer of LAYERS) {
    for (const name of subdirs(`${layer.dir}/addons`)) add(name, `${layer.dir}/addons/${name}`);
  }
  for (const name of subdirs('apps')) {
    if (name in listed && existsSync(join(ROOT, 'apps', name, 'package.json'))) {
      add(name, `apps/${name}`);
    }
  }
  return found;
}

function expectedFiles() {
  return [
    ...LAYERS.map((layer) => {
      const names = subdirs(`${layer.dir}/addons`);
      return { path: `${layer.dir}/addons.generated.ts`, text: layer.write(names, layer.dir) };
    }),
    { path: 'packages/locales/src/languages.generated.ts', text: languagesFile() },
  ];
}

/** Imports of an add-on folder from anywhere but a generated file or the add-on itself. */
function boundaryViolations() {
  const bad = [];
  const roots = [...new Set(LAYERS.map((l) => l.dir.split('/').slice(0, 2).join('/')))];
  const walk = (dir) => {
    for (const entry of readdirSync(join(ROOT, dir))) {
      if (entry === 'node_modules' || entry === 'dist' || entry === 'addons') continue;
      const path = `${dir}/${entry}`;
      if (statSync(join(ROOT, path)).isDirectory()) walk(path);
      else if (/\.tsx?$/.test(entry) && !entry.endsWith('addons.generated.ts')) {
        const text = readFileSync(join(ROOT, path), 'utf8');
        if (/from\s+['"][^'"]*\/addons\/|import\(\s*['"][^'"]*\/addons\//.test(text))
          bad.push(path);
      }
    }
  };
  for (const root of roots) if (existsSync(join(ROOT, root))) walk(root);
  return bad;
}

// --- removing an add-on ------------------------------------------------------

/**
 * Lines between `# addon:<name> begin` and `# addon:<name> end` in config
 * files that cannot import anything (pnpm's catalogs), removed whole.
 */
function removeRegions(name, file) {
  const path = join(ROOT, file);
  if (!existsSync(path)) return;
  const out = [];
  let skipping = false;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    if (line.trim() === `# addon:${name} begin`) skipping = true;
    else if (line.trim() === `# addon:${name} end`) skipping = false;
    else if (!skipping) out.push(line);
  }
  writeFileSync(path, out.join('\n').replace(/\n{3,}/g, '\n\n'));
}

function removeScripts(name) {
  const path = join(ROOT, 'package.json');
  const pkg = JSON.parse(readFileSync(path, 'utf8'));
  for (const script of Object.keys(pkg.scripts ?? {})) {
    if (script.endsWith(`:${name}`)) delete pkg.scripts[script];
  }
  writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
}

function rebuildMigrations() {
  const migrations = join(ROOT, 'packages/database/src/migrations');
  for (const entry of readdirSync(migrations)) rmSync(join(migrations, entry), { recursive: true });
  const run = (cmd, cwd = ROOT) => execSync(cmd, { cwd, stdio: 'inherit' });
  run('pnpm --filter @pkg/contracts --filter @pkg/database build');
  run('npx drizzle-kit generate --name baseline', join(ROOT, 'packages/database'));
}

// --- main --------------------------------------------------------------------

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

function check() {
  const { addons } = readConfig();
  const problems = [];
  for (const [name, paths] of presence(addons)) {
    if (!(name in addons))
      problems.push(`"${name}" exists (${paths[0]}) but valmatic.json does not list it.`);
    else if (!addons[name])
      problems.push(
        `"${name}" is off in valmatic.json but still here: ${paths.join(', ')}. Run pnpm valmatic:sync.`,
      );
  }
  const found = presence(addons);
  for (const [name, on] of Object.entries(addons)) {
    if (on && !found.has(name))
      problems.push(
        `"${name}" is on in valmatic.json but has no folders. Copy them in from valmatic.`,
      );
  }
  for (const { path, text } of expectedFiles()) {
    const current = existsSync(join(ROOT, path)) ? readFileSync(join(ROOT, path), 'utf8') : null;
    if (current !== text) problems.push(`${path} is out of date. Run pnpm valmatic:sync.`);
  }
  for (const path of unkeptTranslations()) {
    problems.push(`${path} is a language valmatic.json does not keep. Run pnpm valmatic:sync.`);
  }
  for (const path of boundaryViolations()) {
    problems.push(`${path} imports an add-on folder. Only addons.generated.ts may.`);
  }
  if (problems.length > 0) {
    for (const p of problems) console.error(`✗ ${p}`);
    process.exit(1);
  }
  console.log('✓ add-ons and languages in step with valmatic.json');
}

function sync(flags) {
  if (flags.has('--minimal')) {
    const config = JSON.parse(readFileSync(CONFIG, 'utf8'));
    for (const name of Object.keys(config.addons ?? {})) config.addons[name] = false;
    config.languages = [REFERENCE_LANGUAGE];
    config.defaultLanguage = REFERENCE_LANGUAGE;
    writeFileSync(CONFIG, JSON.stringify(config, null, 2) + '\n');
  }
  const { addons } = readConfig();

  const found = presence(addons);
  for (const [name, paths] of found) {
    if (!(name in addons))
      fail(`"${name}" exists (${paths[0]}) but valmatic.json does not list it.`);
  }
  let databaseChanged = false;
  for (const [name, on] of Object.entries(addons)) {
    if (on) {
      if (!found.has(name))
        fail(`"${name}" is on but has no folders. Copy them in from valmatic first.`);
      continue;
    }
    const paths = found.get(name) ?? [];
    const touchesDatabase = paths.some((p) => p.startsWith('packages/database/'));
    if (touchesDatabase && !flags.has('--new-project')) {
      fail(
        `"${name}" has database tables. Removing it from a project with a live database needs a migration that drops them; ` +
          'write that by hand. For a new project, run with --new-project.',
      );
    }
    for (const path of paths) {
      rmSync(join(ROOT, path), { recursive: true, force: true });
      console.log(`− ${path}`);
    }
    removeRegions(name, 'pnpm-workspace.yaml');
    removeScripts(name);
    databaseChanged ||= touchesDatabase;
  }
  for (const path of unkeptTranslations()) {
    rmSync(join(ROOT, path));
    console.log(`− ${path}`);
  }
  for (const { path, text } of expectedFiles()) {
    writeFileSync(join(ROOT, path), text);
  }
  console.log(
    `✓ generated files written (languages: ${LANGUAGES.join(', ')}; default ${DEFAULT_LANGUAGE})`,
  );

  if (databaseChanged) {
    console.log('↻ rebuilding the database migrations from the remaining tables');
    rebuildMigrations();
  }
  if (flags.has('--verify')) {
    execSync('pnpm install', { cwd: ROOT, stdio: 'inherit' });
    execSync('pnpm verify', { cwd: ROOT, stdio: 'inherit' });
  }
}

const args = new Set(process.argv.slice(2));
if (args.has('--check')) check();
else sync(args);
