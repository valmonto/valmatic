/**
 * Build identity — WHICH code this process is running.
 *
 * Derived, never hand-maintained: the image build receives `GIT_SHA` and
 * `BUILT_AT` as build args (`--build-arg GIT_SHA=$(git rev-parse HEAD)`), the
 * Dockerfile bakes them into env, and this reads them back. A version bumped
 * by hand gets skipped or set wrong, and a wrong version is worse than none —
 * the same failure class as a deploy that reports green while shipping
 * nothing.
 *
 * A missing or malformed value is reported as `null`, not as a placeholder
 * string: an unknown version must never be mistakable for a known one.
 */
export interface BuildInfo {
  /** Full 40-hex commit SHA the image was built from, or null when unknown. */
  sha: string | null;
  /** First 7 characters of `sha` for display, or null when unknown. */
  shortSha: string | null;
  /** ISO-8601 build timestamp, or null when unknown. */
  builtAt: string | null;
}

const FULL_SHA = /^[0-9a-f]{40}$/;

export function readBuildInfo(env: NodeJS.ProcessEnv = process.env): BuildInfo {
  const rawSha = env.GIT_SHA?.trim().toLowerCase() ?? '';
  const sha = FULL_SHA.test(rawSha) ? rawSha : null;

  const rawBuiltAt = env.BUILT_AT?.trim() ?? '';
  const parsed = rawBuiltAt ? Date.parse(rawBuiltAt) : Number.NaN;
  const builtAt = Number.isNaN(parsed) ? null : new Date(parsed).toISOString();

  return { sha, shortSha: sha ? sha.slice(0, 7) : null, builtAt };
}
