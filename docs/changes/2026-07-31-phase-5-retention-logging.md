# Change record — Phase 5 retention, deletion, and logging

**Date:** 2026-07-31  
**Branch:** `security/privacy-retention-logging`  
**Pull request:** pending  
**Recovery phase:** 5  
**Status:** COMPLETE

## Summary

Implements ADR-012 / C-07 image retention purge (DRAFT 24h, unconfirmed 7d, confirmed **30d after appointment**), admin manual photo delete, structured logging with PII and signed-URL redaction, daily Netlify scheduled purge, and retention query indexes.

## Recovery phase

5 — Retención, borrado y logging.

## Scope included

- Domain retention windows (`image-retention.ts`) with C-07 30d post-appointment rule
- Idempotent purge use-case: Storage delete + `photos.deleted_at` + reference cleanup on bookings/ai_jobs
- `POST /api/cron/purge`, `POST /api/admin/purge`, `POST /api/admin/photos/delete`
- Netlify scheduled function `purge-images.mts` (`@daily`)
- Structured logging module with redaction
- Migration `20260731150000_image_retention_indexes.sql`
- Kill switch `PURGE_ENABLED=false`
- Unit tests for retention boundaries and premature-deletion protection
- Change record, agent run, operator action OP-011

## Scope excluded

- Admin UI delete button (API only; UI optional follow-up)
- Change to retention policy values (business decision)

## Architecture impact

- Purge mirrors expire-due pattern: cron + admin manual trigger share one use-case
- Logging centralised in `structured-log.ts` for future routes

## API impact

- New: `POST /api/cron/purge`, `POST /api/admin/purge`, `POST /api/admin/photos/delete`

## Data and migration impact

- New indexes on `photos` and `booking_requests` for purge queries
- Soft delete via existing `photos.deleted_at`

## Security and privacy impact

- Logs redact signed URLs, email, phone, and sensitive object keys
- Purge cron protected by `CRON_SECRET`; admin delete requires staff session
- Confirmed images retained until 30d **after appointment**, not 7d after confirm

## Testing evidence

| Check | Command | Result |
|------|---------|--------|
| Lint | `npm run lint` | PASS |
| Typecheck | `npm run typecheck` | PASS |
| Tests | `npm run test` | PASS (116) |
| Build | `npm run build` | PASS |

## Deployment and rollback

- Apply migration `20260731150000_image_retention_indexes.sql` on Supabase
- Set `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL`; optional retention env overrides
- Rollback: set `PURGE_ENABLED=false` or disable `purge-images` schedule; previous deploy

## Documentation updated

- `docs/api-contracts.md`, `.env.example`, `netlify.toml`, `docs/operator-actions.md`
- This change record and `docs/agent-runs/2026-07-31-phase-5.md`

## Remaining risks

- Live purge cron unverified until preview deploy (OP-011)
- Stack predecessor PR #13 not merged

## Verification status

- Planner: N/A (scoped implementation)
- Architect: N/A
- Security: retention policy aligned with ADR-012
- Tests: unit + mocked Supabase
- Independent verifier: pending

## Stack dependency

Merge after PR #13 (`feature/durable-demo-inbox`).
