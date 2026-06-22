# Security model

## Reporting

Do not open public issues for vulnerabilities. Send a private report to the configured security contact with reproduction steps, affected tenant, impact and request ID. Never include live credentials or customer data.

## Controls in this repository

- Passwords are bcrypt hashes; password fields are never returned by ticket APIs.
- Protected pages and APIs require an authenticated session.
- Login attempts are rate-limited by IP and normalized username through Redis, with a bounded in-process development fallback.
- Successful and failed authentication attempts are stored in append-only login history with IP and user agent.
- Sessions carry a signed tenant claim and expire after 30 minutes.
- Authorization is expressed as named permissions in `lib/rbac.ts`.
- Prisma parameterizes database access.
- CSP, frame protection, MIME protection, referrer and permissions headers are configured globally.
- Mutating ticket operations append audit records.
- Health responses expose status only and no credentials.
- Production secrets belong in the deployment secret manager, never source control.

## Required before production

- Upgrade framework/auth dependencies to currently supported security releases.
- Add Redis-backed rate limiting and refresh-token rotation.
- Add tenant-scoped query enforcement and PostgreSQL RLS.
- Add CSRF tokens, HTML sanitization and attachment malware scanning.
- Encrypt PII using envelope encryption with a managed KMS.
- Verify backup restoration, log retention and session revocation.
- Run SAST, dependency scanning, container scanning and an independent penetration test.

## Audit policy

Audit records are append-only through application permissions. Production PostgreSQL must deny UPDATE and DELETE on the audit table to the application role, with retention and archival applied by a separate privileged maintenance identity.
