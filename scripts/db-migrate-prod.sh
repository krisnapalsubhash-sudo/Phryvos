#!/usr/bin/env bash
# ==============================================================================
# Phryvos Production Database Migration Script
# ==============================================================================
# Executes versioned Prisma migrations in production environments.
# Never runs destructive `prisma db push` in production.
# ==============================================================================

set -euo pipefail

echo "======================================================"
echo "🚀 Phryvos Production Database Migration Runner"
echo "======================================================"

if [ -z "${DATABASE_URL:-}" ]; then
  if [ -f ./.env.local ]; then
    export $(grep -v '^#' ./.env.local | grep DATABASE_URL | xargs -d '\n' || true)
  elif [ -f ./.env ]; then
    export $(grep -v '^#' ./.env | grep DATABASE_URL | xargs -d '\n' || true)
  fi
fi

# Verify DATABASE_URL
if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set."
  exit 1
fi

echo "📋 Target Database: $(echo "$DATABASE_URL" | sed -E 's/:[^@]+@/:***@/')"

# Verify Prisma CLI is available
if ! command -v npx &> /dev/null; then
  echo "❌ ERROR: npx command not found. Node.js environment required."
  exit 1
fi

echo "🔍 Running 'prisma migrate deploy' for deterministic production migration..."
npx prisma migrate deploy

echo "🔍 Verifying generated Prisma client..."
npx prisma generate

echo "======================================================"
echo "✅ Production database migrations applied successfully!"
echo "======================================================"
