# Phryvos Disaster Recovery (DR) & Business Continuity Runbook

## 1. Objectives & SLA Targets
- **Recovery Point Objective (RPO):** < 1 hour (Maximum allowable data loss in the event of catastrophic infrastructure failure).
- **Recovery Time Objective (RTO):** < 15 minutes (Maximum acceptable downtime before service restoration).

---

## 2. Database Backup & Restore (PostgreSQL)

### A. Snapshot Backup Schedule
- Daily full logical backup via `pg_dump`:
  ```bash
  pg_dump -Fc -v -d "$DATABASE_URL" -f "phryvos_backup_$(date +%Y%m%d_%H%M%S).dump"
  ```
- Backups are encrypted at rest with AES-256 and uploaded to an immutable off-site cloud storage bucket with a 30-day retention lifecycle policy.

### B. Restoration Drill Procedure
1. Create a clean staging database instance.
2. Execute restore command:
   ```bash
   pg_restore --clean --if-exists -v -d "$NEW_DATABASE_URL" phryvos_backup_latest.dump
   ```
3. Run verification query:
   ```bash
   npx prisma migrate status
   ```
4. Verify user, conversation, and post record integrity.

---

## 3. Migration Rollback Strategy
- Every schema modification must be accompanied by an atomic migration.
- If a deployment migration fails or causes data regressions:
  ```bash
  # Step 1: Mark failed migration as rolled back
  npx prisma migrate resolve --rolled-back "<migration_name>"

  # Step 2: Deploy previous stable migration
  npx prisma migrate deploy
  ```
- **Strict Rule:** Never run `prisma db push --accept-data-loss` in production or staging environments.

---

## 4. Realtime & Redis Failure Recovery
- **Redis Outage Behavior:** Phryvos Realtime engine automatically degrades to local single-instance in-memory broadcast fallback when Redis connectivity is lost, logging a high-priority alert without dropping ongoing active rooms.
- **Node/Worker Restart:** All active rooms and matching sessions are reconstructed from Postgres or re-negotiated seamlessly by client heartbeat reconnect loops.

---

## 5. Media & Storage Recovery (Cloudflare R2 / S3)
- Media assets are distributed via Cloudflare CDN with dual-region replication enabled.
- User uploaded files are content-addressed and path-namespaced by user ID (`posts/{userId}/...`, `voice/{userId}/...`).
- Deleted items are soft-flagged in database with 30-day purge lifecycle for audit and regulatory compliance.
