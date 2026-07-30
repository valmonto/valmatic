Read ./README.md before changing this workspace.

- This README is the canonical "which kind of test" guide — workspace docs
  link here instead of repeating it. Keep it that way.
- Consumers include Nest apps using classic Node resolution: package.json must
  keep main/types alongside exports, or imports silently break.
- describeIntegration skips without DATABASE_URL by design — never make it
  fail instead; pnpm verify must pass on a machine with nothing running.
