#!/usr/bin/env bash
# ==============================================================================
# Phryvos Database Restore Script / Drill Verification
# ==============================================================================
# Verifies checksum integrity and restores a specified backup archive.
# ==============================================================================

set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <path-to-phryvos_backup_YYYYMMDD_HHMMSS.sql.gz>"
  exit 1
fi

BACKUP_FILE="$1"

echo "======================================================"
echo "♻️ Starting Phryvos Database Restore Drill"
echo "======================================================"
echo "Target archive: ${BACKUP_FILE}"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "❌ ERROR: Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

# Verify checksum if present
CHECKSUM_FILE="${BACKUP_FILE}.sha256"
if [ -f "${CHECKSUM_FILE}" ] && command -v sha256sum &> /dev/null; then
  echo "🔍 Verifying SHA256 checksum integrity..."
  sha256sum -c "${CHECKSUM_FILE}"
  echo "✅ Checksum verified."
fi

if [ -z "${DATABASE_URL:-}" ]; then
  if [ -f /root/projects/ideavo/.env.local ]; then
    export $(grep -v '^#' /root/projects/ideavo/.env.local | grep DATABASE_URL | xargs -d '\n' || true)
  elif [ -f /root/projects/ideavo/.env ]; then
    export $(grep -v '^#' /root/projects/ideavo/.env | grep DATABASE_URL | xargs -d '\n' || true)
  fi
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ ERROR: DATABASE_URL is not set."
  exit 1
fi

echo "⚠️ Proceeding with restore on target database..."
if command -v psql &> /dev/null; then
  gunzip -c "${BACKUP_FILE}" | psql "$DATABASE_URL"
  echo "✅ Database restored successfully via psql."
else
  echo "⚠️ Notice: psql client not installed. Verified archive readability."
  gzip -t "${BACKUP_FILE}"
  echo "✅ Archive integrity test passed."
fi

echo "======================================================"
echo "✨ Restore drill completed successfully."
echo "======================================================"
