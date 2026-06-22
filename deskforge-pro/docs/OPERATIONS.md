# Operations runbook

## Health and metrics

- `GET /api/health` checks database connectivity and returns 200 or 503.
- `GET /api/metrics` emits Prometheus text metrics and requires `Authorization: Bearer $METRICS_SECRET`.
- Configure Railway/Kubernetes probes against `/api/health`.

## SLA scheduler

Invoke `POST /api/cron/sla` every five minutes with `Authorization: Bearer $CRON_SECRET`. The job updates warning/breach state, appends audit entries, creates notifications, and closes tickets 72 hours after resolution. The operation is idempotent for unchanged records.

## Authentication operations

Redis stores login throttling counters using a 15-minute TTL. Five attempts are allowed for each IP/username pair. Successful authentication clears the counter; all outcomes append a login-history record. Alert on sustained rate-limit events or distributed attempts against one account.

## Backup and restore

1. Run encrypted `pg_dump --format=custom` daily to restricted object storage.
2. Retain daily backups for 30 days and monthly backups according to tenant policy.
3. Restore into an isolated database monthly using `pg_restore --clean --if-exists`.
4. Run migration status and application smoke tests against the restored database.
5. Record restoration duration and recovery point; RTO/RPO claims require this evidence.

## Deployment

1. Build the immutable container in CI.
2. Run `prisma migrate deploy` as a single release task.
3. Deploy staging, execute health and ticket-lifecycle smoke tests, then promote the same image digest.
4. Roll back application image first; use forward-fix database migrations rather than destructive rollback.

## Alerts

- Health endpoint non-200 for two consecutive minutes.
- p95 HTTP latency above 200ms for five minutes.
- Error rate above 2%, queue lag above five minutes, or any failed SLA cron run.
- Database connections above 80%, storage above 75%, backup missed, or certificate expiry below 21 days.
