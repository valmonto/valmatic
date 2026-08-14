#!/usr/bin/env bash
#
# dev-stack.sh — boot a THROWAWAY api+vite dev stack for a build's Playwright
# browser check, with GUARANTEED teardown.
#
# A build subagent boots a disposable stack (NestJS api + Vite web against a
# throwaway `devstack_*` Postgres DB) to drive its browser check, then is
# supposed to tear it down. When the subagent's shell dies mid-check (failure,
# timeout, interrupt) the happy-path teardown never runs and the stack is
# orphaned — an unattended run once left a Vite listener and gigabytes of cruft
# behind.
#
# The fix here is a `trap cleanup EXIT INT TERM`: teardown is bound to shell
# exit, so it fires on success, failure, AND interrupt. It is belt-and-suspenders
# on top of any happy-path cleanup — running it twice is harmless.
#
# WHAT IT TEARS DOWN (only what THIS script started):
#   - the api + vite process groups it launched (tracked PIDs, killed as groups
#     so nest/vite child processes go too);
#   - anything still bound to THIS stack's ports (fuser -k on the throwaway
#     ports only — never a live :3000/:5173);
#   - the throwaway `devstack_*` database (dropdb --force, terminating any
#     lingering connection).
#
# USAGE:
#   scripts/dev-stack.sh [command...]
#     No command  -> boot the stack, print the URLs, and hold until interrupted
#                    (Ctrl-C / SIGTERM triggers teardown).
#     A command   -> boot the stack, run `command...` (e.g. the browser check),
#                    then tear down and exit with the command's status.
#
# CONFIG (env overrides):
#   API_PORT  (default 3002)   throwaway api port  — MUST NOT be 3000 (dev api)
#   WEB_PORT  (default 5175)   throwaway vite port — MUST NOT be 5173 (dev web)
#   DEVSTACK_DB (default devstack_$$)  throwaway DB — MUST match devstack_*
#   PG_HOST/PG_PORT/PG_USER/PGPASSWORD (default 127.0.0.1/5432/valmatic/valmatic)
#
# The Vite dev server proxies /api to this stack's api via API_PROXY_TARGET
# (honoured by apps/web/vite.config.ts; defaults to :3000 when unset).
#
# SAFETY: a machine may also run a LIVE dev stack in watch mode on :3000/:5173
# with cwd in the main checkout. This script refuses to run on those ports,
# refuses a DB name outside the `devstack_` namespace, and only ever kills the
# throwaway ports it was told to use — so it can never take a live stack down.
#
set -euo pipefail

API_PORT="${API_PORT:-3002}"
WEB_PORT="${WEB_PORT:-5175}"
DEVSTACK_DB="${DEVSTACK_DB:-devstack_$$}"
PG_HOST="${PG_HOST:-127.0.0.1}"
PG_PORT="${PG_PORT:-5432}"
PG_USER="${PG_USER:-valmatic}"
export PGPASSWORD="${PGPASSWORD:-valmatic}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATABASE_URL="postgresql://${PG_USER}:${PGPASSWORD}@${PG_HOST}:${PG_PORT}/${DEVSTACK_DB}"

# --- Guardrails: never operate on the live stack --------------------------------
if [[ "$API_PORT" == "3000" || "$WEB_PORT" == "5173" ]]; then
  echo "dev-stack: refusing to use the LIVE ports (:3000/:5173). Pick a throwaway port set." >&2
  exit 2
fi
if [[ "$DEVSTACK_DB" != devstack_* ]]; then
  echo "dev-stack: refusing DB '$DEVSTACK_DB' — throwaway DBs must be named devstack_* (never valmatic_test/valmatic_dev)." >&2
  exit 2
fi

PIDS=()

cleanup() {
  local code=$?
  trap - EXIT INT TERM   # make teardown idempotent / re-entrancy-safe
  echo "dev-stack: tearing down (exit $code)…" >&2

  # 1) Kill the process GROUPS we started (negative pid = whole group), so the
  #    nest/vite children die with their launcher instead of being orphaned.
  for pid in "${PIDS[@]:-}"; do
    [[ -n "$pid" ]] || continue
    kill -TERM "-${pid}" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true
  done

  # 2) Belt-and-suspenders: free THIS stack's ports (throwaway ports only).
  if command -v fuser >/dev/null 2>&1; then
    fuser -k "${API_PORT}/tcp" "${WEB_PORT}/tcp" 2>/dev/null || true
  fi

  # 3) Drop the throwaway DB, force-terminating any lingering connection.
  dropdb --if-exists --force -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" "$DEVSTACK_DB" 2>/dev/null || true

  exit "$code"
}
trap cleanup EXIT INT TERM

# --- Boot -----------------------------------------------------------------------
echo "dev-stack: creating throwaway DB $DEVSTACK_DB and migrating…" >&2
createdb -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" "$DEVSTACK_DB"
DATABASE_URL="$DATABASE_URL" pnpm --filter @pkg/database build >/dev/null
DATABASE_URL="$DATABASE_URL" pnpm --filter @pkg/database db:migrate

echo "dev-stack: booting api on :$API_PORT…" >&2
# setsid gives each service its own process group so cleanup can kill the group.
PORT="$API_PORT" DATABASE_URL="$DATABASE_URL" \
  setsid pnpm --filter @pkg/api dev &
PIDS+=("$!")

echo "dev-stack: booting vite on :$WEB_PORT (proxy /api -> :$API_PORT)…" >&2
API_PROXY_TARGET="http://127.0.0.1:${API_PORT}" \
  setsid pnpm --filter @pkg/web dev -- --port "$WEB_PORT" --strictPort &
PIDS+=("$!")

echo "dev-stack: api http://127.0.0.1:${API_PORT}  web http://127.0.0.1:${WEB_PORT}" >&2

if [[ $# -gt 0 ]]; then
  # Run the given command (e.g. the browser check) then let the trap tear down.
  "$@"
else
  # Hold until interrupted; the EXIT/INT/TERM trap tears the stack down.
  wait
fi
