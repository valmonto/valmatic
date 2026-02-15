#!/bin/sh
set -e

echo "Running database migrations..."
node /app/packages/database/dist/cli/migrate.mjs

echo "Starting API server..."
exec node dist/main.js
