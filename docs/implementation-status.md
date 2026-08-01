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

**Status: NOT VERIFIED**

- Phase 9 smoke checklist documented: `docs/dod-smoke-checklist.md`
- Operator action OP-017 pending — no public Replicate smoke executed with evidence
- Production not declared live until OP-017 completes and `dodStatus` is attested VERIFIED
