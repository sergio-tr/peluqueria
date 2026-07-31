# Change record — Phase 4 durable Demo Inbox and NotificationPort

**Date:** 2026-07-31  
**Branch:** `feature/durable-demo-inbox`  
**Pull request:** pending  
**Recovery phase:** 4  
**Status:** COMPLETE

## Summary

Introduces `NotificationPort` with `DemoInboxNotificationAdapter` (D-01). Barber propose/approve sends a durable proposal message via the port; client confirm sends a single final inbox message guarded by existing D-08 idempotency key `booking-confirmed:{booking_id}`. Admin `GET /api/admin/demo-inbox` and admin UI already read from Postgres — unchanged contract.

## Recovery phase

4 — NotificationPort y Demo Inbox durable.

## Scope included

- `NotificationPort` domain contract + message builders
- `DemoInboxNotificationAdapter` persisting to `demo_inbox_messages`
- `barber-transition` and `confirm-booking` wired through the port
- Final notification on first confirm only (no duplicate on idempotent replay)
- Unit tests: propose creates message with confirm path; confirm sends once; replay skips notification
- Change record and agent run

## Scope excluded

- Resend / real email (D-01)
- Customer-facing inbox page (admin Demo Inbox remains the demo path per user flows)
- Retention / purge (Phase 5)

## Architecture impact

- Domain `NotificationPort` decouples booking use-cases from delivery mechanism
- Demo adapter is the v1 implementation; Resend can plug in later without changing confirm/propose flows

## API impact

- No HTTP contract changes
- `GET /api/admin/demo-inbox` continues to list durable messages from Postgres

## Data and migration impact

- Uses existing `demo_inbox_messages` and `idempotency_keys` tables (1D + 2C migrations)
- No new migrations in this phase

## Security and privacy impact

- Proposal messages contain confirm token path (existing behaviour); tokens remain hash-only in DB
- Admin inbox endpoint remains auth-protected

## Testing evidence

| Check | Command | Result |
|------|---------|--------|
| Lint | `npm run lint` | PASS |
| Typecheck | `npm run typecheck` | PASS |
| Tests | `npm run test` | PASS (104) |
| Build | `npm run build` | PASS |

## Deployment and rollback

- Requires migrations from 1D (`demo_inbox_messages`) and 2C (`idempotency_keys`) applied on Supabase
- Rollback: previous deploy

## Documentation updated

- This change record
- `docs/agent-runs/2026-07-31-phase-4.md`

## Remaining risks

- Live Supabase must have 1D + 2C migrations applied before deploy
- Stack PRs #12 (3C) and predecessors unmerged — merge in order

## Verification status

- Planner: N/A (scoped implementation)
- Architect: N/A
- Security: N/A (no new auth surface)
- Tests: unit + mocked Supabase
- Independent verifier: pending

## Stack dependency

Merge after PR #12 (`feature/replicate-storage-limits`).
