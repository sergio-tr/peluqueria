# Implementation status

**Updated:** 2026-07-31

## Stack / governance

| Item | Status |
|------|--------|
| `chore/agent-governance` | PR open (predecessor) |
| Phase 1A persistence foundation | IN_PROGRESS on `feature/persistence-foundation` |

## Runtime truth

- Production must use Supabase (`DATA_STORE=supabase`); memory forbidden in prod (enforced in config).
- Master-data APIs, bookings, photos, Replicate: not yet on this branch as completed phases.

## DoD

Not met. No public smoke with Replicate.
