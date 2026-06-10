#!/bin/sh
set -e

# Migrations run once via the dedicated `migrate` one-shot service in compose
# (so they don't race when the API is scaled to multiple replicas).
echo "Starting API server..."
exec node dist/main.js
