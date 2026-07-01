# Changelog

All notable changes to DeskForge Enterprise are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased] — Enterprise 2.0 security hardening (branch `feat/enterprise-2.0-security-hardening`)

### Security
- **DF-2026-001** — Un-minified core business logic (`auth`, `sla`, `rbac`, `change-workflow`, `problem-management`) into readable, JSDoc-documented modules for auditability. Logic unchanged; all tests green.
- **DF-2026-010** — Added `LICENSE` (AGPL-3.0) at repo root and `scripts/check-secrets.js` pre-commit secret scanner.

### Notes
- License: chosen **AGPL-3.0** per project intent. The `LICENSE` file carries the standard AGPL-3.0 notice and links to the canonical full text; embed the full text from gnu.org if a self-contained copy is required.
- Several roadmap items (RLS enforcement, PII encryption, ClamAV attachment scanning, distributed rate-limiting, BullMQ workers) require external infrastructure (dedicated DB role, KMS, ClamAV, Redis) and are tracked separately — they are intentionally not stubbed.
