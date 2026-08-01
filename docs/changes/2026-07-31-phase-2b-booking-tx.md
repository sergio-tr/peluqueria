# Change record — Phase 2B booking transaction consistency

**Date:** 2026-07-31  
**Branch:** `fix/booking-transaction-consistency`  
**Pull request:** pending  
**Recovery phase:** 2B  
**Status:** COMPLETE

## Summary

Booking create, barber transitions, confirm/decline, and expiry now run through Postgres RPC functions in a single transaction with `booking_events`. Slot conflicts rely on the `booking_no_overlap` GiST exclusion constraint (D-07 blocking statuses) instead of read-then-write overlap checks. Exclusion and unique violations map to HTTP 409.

## Recovery phase

2B — Transacciones, exclusión y estados (recovery plan).

## Scope included

- Forward migration: idempotent exclusion constraint check + `create_booking_request_tx` / `transition_booking_request_tx` RPCs
- Transactional create (`POST /api/booking-requests`) with event
- Transactional admin propose/reject and confirm/decline transitions
- Transactional expire-due (cron + admin) with atomic slot release
- Postgres error mapping (`23P01`, `23505` → 409)
- Unit/integration-style tests for state machine, overlap helpers, RPC wrappers, conflict mapping
- Domain helpers: `booking-slot.ts`

## Scope excluded

- Confirm token / idempotency rewrite (2C)
- Catalog assets (2D)
- Auth redesign (2A, merged via stack)

## Architecture impact

- Write path for bookings uses Supabase RPC (service role) instead of separate insert/update + event calls
- `hasOverlappingBooking` retained as optional read helper; enforcement is DB-side
- Live GiST exclusion requires operator to apply migration on Supabase (not verified in CI)

## API impact

- Same endpoints; concurrent double-book on same slot returns 409 for the loser
- Invalid concurrent state transitions return 409 `INVALID_STATE`

## Data and migration impact

- `20260731110000_booking_tx_rpcs.sql`: forward-fix constraint + RPC functions granted to `service_role`

## Security and privacy impact

- RPC functions revoked from `public`; executable only by `service_role`
- Row locks (`FOR UPDATE`) on transitions reduce lost-update races

## Testing evidence

| Check | Command | Result |
|------|---------|--------|
| Lint | `npm run lint` | PASS |
| Typecheck | `npm run typecheck` | PASS |
| Tests | `npm run test` | PASS (53) |
| Build | `npm run build` | PASS |

**Note:** Concurrent overlap against live Postgres GiST is documented for operator verification; CI uses mocked RPC conflict responses.

## Deployment and rollback

- Apply `20260731110000_booking_tx_rpcs.sql` to Supabase before deploy
- Rollback: previous deploy; migration is forward-only (RPC drop is manual corrective)

## Documentation updated

- This change record
- `docs/agent-runs/2026-07-31-phase-2b.md`

## Remaining risks

- Operator must run migration; live double-book GiST test not automated in CI
- DST edge cases on `tstzrange` unchanged from init schema

## Verification status

- Planner: N/A (scoped implementation)
- Architect: N/A
- Security: N/A (no new auth surface)
- Tests: unit + mocked RPC conflict
- Independent verifier: pending
