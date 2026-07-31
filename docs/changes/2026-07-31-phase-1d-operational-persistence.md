# Change record — Phase 1D operational persistence

**Date:** 2026-07-31  
**Branch:** `feature/operational-persistence`  
**Pull request:** TBD  
**Recovery phase:** `1D`  
**Status:** COMPLETE (pending live Supabase verification)

## Summary

Persist operational entities (`ai_jobs`, `booking_requests`, `booking_events`, `confirmation_tokens`, `demo_inbox_messages`) in Postgres via repositories and application use-cases. Production API routes no longer import `memoryDb`.

## Recovery phase

1D

## Scope included

- Repositories/mappers under `src/infrastructure/persistence/repositories/`
- Application use-cases for bookings, confirmations, AI job queue rows, expire-due
- Rewritten API routes using `requireSupabase` (503 when `DATA_STORE=memory`)
- Admin gate via `ADMIN_DEMO_KEY` env (fail-closed, no default secret)
- Unit tests for mappers and booking create + event append
- `booking-holds` extracted to domain (memory store re-exports for tests)

## Scope excluded

- Overlap exclusion transactions (2B)
- Supabase Auth for admin (2A)
- Replicate webhook handler (3B)
- Copy Replicate output to storage (3C)
- `webhooks/replicate` route (not committed)

## Architecture impact

Operational writes flow: API → use-case → repository → Supabase service client. App-level overlap checks until GiST constraint is fully exercised in 2B.

## API impact

- `POST/GET /api/booking-requests`
- `GET/POST /api/admin/booking-requests`, `GET/POST /api/admin/booking-requests/[id]`
- `GET /api/admin/demo-inbox`, `POST /api/admin/expire-due`
- `POST /api/confirm`, `GET /api/confirm/[token]`
- `POST /api/cron/expire`
- `POST /api/ai/jobs`, `GET /api/ai/jobs/[jobId]`, `POST /api/ai/jobs/[jobId]/retry`

## Data and migration impact

Uses existing schema from `20260730100000_init.sql`. No forward migration required.

## Security and privacy impact

Confirmation tokens stored as SHA-256 hashes only. Admin routes require `ADMIN_DEMO_KEY` header; 401 when unset.

## Testing evidence

| Check | Command | Result |
|------|---------|--------|
| Tests | npm test | 32 passed |
| Typecheck | npm run typecheck | pass |
| Lint | npm run lint | pass |
| Build | npm run build | pass |

## Deployment and rollback

Requires `DATA_STORE=supabase` and service role key. Roll back via revert PR.

## Documentation updated

- This change record
- `docs/agent-runs/2026-07-31-phase-1d.md`

## Remaining risks

- Live Supabase not verified in CI for operational writes

## Verification status

- Tests: unit mappers + booking create
- Independent verifier: pending at merge time

## Stack dependency

Depends on PR #4 (`security/secure-photo-storage`). Merge order: #1 → #2 → #3 → #4 → this.

## Blockers

- Live Supabase not verified in this run — Draft PR if credentials unavailable.
