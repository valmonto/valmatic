import { existsSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

/**
 * Workspace directory names, read from disk rather than listed by hand — a
 * hand-written enum goes stale the moment a package is added, and rejects the
 * commit that adds it.
 */
function workspaceScopes() {
  return ['apps', 'packages'].flatMap((group) => {
    const dir = resolve(root, group);
    if (!existsSync(dir)) return [];
    return readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && existsSync(resolve(dir, entry.name, 'package.json')))
      .map((entry) => entry.name);
  });
}

/** Changes that belong to no single workspace. */
const ROOT_SCOPES = ['deps', 'ci', 'release', 'config', 'deploy', 'docs'];

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', [...workspaceScopes(), ...ROOT_SCOPES]],
    // Warn if no scope provided (not error, to allow root-level commits)
    'scope-empty': [1, 'never'],
    // Ensure subject doesn't end with period
    'subject-full-stop': [2, 'never', '.'],
    // Disabled: strict lower-case forbids acronyms (API, DB, TS, URL) in the
    // subject. Leave casing to the author.
    'subject-case': [0],
  },
};
