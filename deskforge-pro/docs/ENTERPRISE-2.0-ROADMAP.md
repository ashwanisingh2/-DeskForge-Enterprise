# DeskForge Enterprise 2.0 delivery plan

The browser-only HTML application remains a product demo. `deskforge-pro` is the production codebase. Enterprise 2.0 is intentionally delivered in auditable phases rather than claiming that infrastructure-heavy integrations work without credentials, providers, migrations, or operational testing.

## Current implemented foundation

- Next.js/TypeScript application with PostgreSQL and Prisma.
- Credential authentication with bcrypt password verification and server sessions.
- Role-aware ticket APIs, comments, audit records, SLA calculations and email hooks.
- Secure response headers, authenticated middleware and request IDs.
- Permission matrix utilities for explicit API authorization.
- Database-aware health endpoint.
- Docker Compose for PostgreSQL, Redis, MinIO and the application.
- Railway and standalone Docker deployment configuration.
- CI pipeline that installs, generates Prisma, provisions the schema and builds.
- Twenty-five realistic tickets, users, SLA policies, KB content and canned responses.
- Tenant records and mandatory tenant ownership across users, tickets, knowledge, notifications, audits, SLA policies and canned responses.
- Tenant-scoped API/page queries sourced from signed session claims.
- Permission-checked ticket mutations and validated lifecycle transitions.
- Five-minute SLA warning/breach processing, notifications and 72-hour auto-close endpoint.
- CMDB assets/relationships, CAB changes/approvals, problems/incidents, catalog schemas and billable time-entry models.
- Prometheus metrics endpoint, OpenAPI contract and operations runbook.
- Executable unit tests for RBAC, lifecycle and SLA behavior.

## Phase 1 — secure multi-tenant foundation

1. Extend direct tenant ownership into membership-based cross-tenant administration and PostgreSQL RLS policies.
2. Resolve tenant from a verified session claim, never from an untrusted request header. Add PostgreSQL RLS policies as defense in depth.
3. Replace the credentials-only session with 15-minute access tokens and rotating, hashed refresh-token records in secure HTTP-only cookies.
4. Add Redis-backed login rate limiting, session revocation, concurrent-session limits and login history.
5. Add CSRF validation to mutations, structured validation errors, DOM sanitization and encrypted PII fields.
6. Require `assertPermission()` in every route and add ownership checks for end users.
7. Test tenant-isolation and RBAC failures before enabling multi-tenant mode.

Exit gate: no cross-tenant access in integration tests; OWASP ASVS controls reviewed; auth and ticket lifecycle E2E tests passing.

## Phase 2 — core ITSM

- BullMQ workers for SLA checks, notifications and auto-close.
- Business-hour and holiday-aware SLA clock with pause/resume history.
- IMAP email ingestion with message-id threading and attachment storage in S3/MinIO.
- Status transition state machine, merge/link operations, custom forms and time entries.
- Escalation matrix, on-call rosters, OLAs and vendor contracts.

## Phase 3 — ITIL modules

- Incident/major-incident communication and post-incident review.
- Problem RCA, known errors and linked incident updates.
- CAB approval workflow, change windows, freeze dates and rollback plans.
- CMDB configuration items, typed relationships and impact traversal.
- Catalog request forms and configurable approval chains.

## Phase 4 — automation, mobility and integrations

- Socket.io events backed by Redis adapter.
- PWA manifest/service worker, offline ticket outbox and push notifications.
- Scoped API keys, OpenAPI specification and signed webhooks.
- Slack, Teams, Twilio, monitoring and identity-provider connectors.
- Report builder, scheduled exports and tenant-scoped data export.

## Phase 5 — scale and assurance

- Archive/purge policies, encrypted backups and restore drills.
- Prometheus metrics, structured logs, Sentry tracing and Grafana dashboards.
- k6 load tests for 1,000 concurrent users and p95 API latency targets.
- Penetration test, dependency/SBOM scanning and incident-response runbooks.
- Staging canary, rollback automation and documented RTO/RPO evidence.

## Non-negotiable acceptance evidence

Claims such as 99.9% uptime, 1,000 concurrent users, sub-200ms p95, penetration-test safety, one-hour RTO or 15-minute RPO require measured reports from the deployed environment. They cannot be guaranteed by source code alone.
