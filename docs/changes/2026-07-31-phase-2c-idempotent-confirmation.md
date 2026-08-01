# Change record — Phase 2C idempotent confirmation and expiration

**Date:** 2026-07-31  
**Branch:** `feature/idempotent-confirmation-expiration`  
**Pull request:** pending  
**Recovery phase:** 2C  
**Status:** COMPLETE

## Summary

Confirmation tokens remain hash-only (sha256); client confirm/decline implements D-08 idempotency with durable `idempotency_keys` (`booking-confirmed:{booking_id}` for Phase 4 notifications). HTTP semantics: 404 unknown token, 410 expired/invalidated, 409 incompatible state, 200 replay without duplicate transitions. Expiration uses shared `expireDueBookingsWithEvents` for cron and admin; holds 24h barber / 12h customer; CONFIRMED never auto-expires.

## Recovery phase

2C — Tokens, confirmación y expiración (recovery plan).

## Scope included

- Migration `idempotency_keys` table
- `confirm-booking` D-08 flow with notification idempotency key prep
- Token invalidation on repropose (existing, verified)
- Shared expire-due use-case (cron + admin)
- Netlify scheduled function stub (`netlify/functions/expire-bookings.mts`, `netlify.toml`)
- Unit tests: confirm idempotency, HTTP codes, expire slot release, hold durations

## Scope excluded

- NotificationPort / Demo Inbox send (Phase 4)
- Catalog assets (2D)
- Replicate / AI pipeline

## Architecture impact

- Confirm writes idempotency key before transition to guard duplicate side effects
- Phase 4 can call `hasIdempotencyKey(bookingConfirmedNotificationKey(id))` before final notification

## API impact

- `POST /api/confirm`: idempotent 200 on replay; 404/410/409 per D-08
- `GET /api/confirm/[token]`: preview allowed for confirmed/declined; 410 for expired/invalidated
- `POST /api/cron/expire` and `POST /api/admin/expire-due`: unchanged contract, same domain op

## Data and migration impact

- `20260731120000_idempotency_keys.sql`: forward-only idempotency store

## Security and privacy impact

- Tokens never persisted as plaintext (hash-only, unchanged from init schema)
- Cron still protected by `CRON_SECRET`

## Testing evidence

| Check | Command | Result |
|------|---------|--------|
| Lint | `npm run lint` | PASS |
| Typecheck | `npm run typecheck` | PASS |
| Tests | `npm run test` | PASS (70) |
| Build | `npm run build` | PASS |

**Note:** Live Netlify cron schedule not verified in CI — Draft PR note if operator has not configured scheduled function.

## Deployment and rollback

- Apply `20260731120000_idempotency_keys.sql` before deploy
- Rollback: previous deploy; kill switch cron via Netlify UI

## Documentation updated

- This change record
- `docs/agent-runs/2026-07-31-phase-2c.md`

## Remaining risks

- Operator must apply idempotency migration
- Live hourly cron on Netlify unverified in CI

## Verification status

- Planner: N/A (scoped implementation)
- Architect: N/A
- Security: N/A (no new auth surface)
- Tests: unit + mocked Supabase
- Independent verifier: pending

## Stack dependency

Merge after PR #7 (`fix/booking-transaction-consistency`).
